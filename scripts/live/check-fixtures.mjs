import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import deployment from '../../deployment.json' with { type: 'json' };

const origin = 'https://a-murex-one.vercel.app';
const signerOrigin = 'https://margin-signer.vercel.app';
const canonicalMargin = deployment.contractAddress;
const canonicalConsumer = deployment.liveEvidence?.consumerDeployment?.contractAddress;
if (!canonicalMargin || !canonicalConsumer) throw new Error('deployment.json is missing the current MARGIN/consumer addresses');
const checks = [
  ['/', 'Every GenLayer transaction reaches consensus through independent validator adjudication before finalization.', 'MARGIN live claim A'],
  ['/b.html', 'GenLayer validators independently adjudicate transactions before the protocol finalizes them.', 'MARGIN live claim B'],
  ['/c.html', 'A finalized GenLayer transaction has passed the protocol consensus lifecycle.', 'MARGIN live claim C'],
];

const proofPath = new URL('./hosted/a/.well-known/margin.json', import.meta.url);
const expectedProof = (await readFile(proofPath, 'utf8')).trim();
const sha = (value) => crypto.createHash('sha256').update(value).digest('hex');

async function check(path, needles) {
  const response = await fetch(`${origin}${path}`, { redirect: 'error' });
  const body = await response.text();
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  if (body.includes('Consensus-backed footnotes')) {
    throw new Error(`${path}: signer-app content detected`);
  }
  for (const needle of needles) {
    if (!body.includes(needle)) throw new Error(`${path}: missing ${JSON.stringify(needle)}`);
  }
  console.log(`${path} HTTP ${response.status}: ${needles.join(' | ')}`);
  console.log(body);
}

for (const [path, ...needles] of checks) await check(path, needles);

const proofResponse = await fetch(`${origin}/.well-known/margin.json`, { redirect: 'error' });
const liveProof = (await proofResponse.text()).trim();
if (!proofResponse.ok) throw new Error(`proof: HTTP ${proofResponse.status}`);
if (liveProof !== expectedProof) throw new Error('proof: deployed content differs from the repository fixture');
console.log(`/.well-known/margin.json HTTP ${proofResponse.status}: exact repository match`);
console.log(liveProof);

const stableManifests = [
  { file: 'bd9a74117d96a75f9ffea9402defbb18067d64fcd12356ac1fa77eea30d7349e.json', relation: 'SUPPORTS', primary: 'e5866f8a9d2c905e3251a3ee53e26c37d5a9a780756a57c896a7fb9decab33c2' },
  { file: 'db4fca64e939f315e5e78f20c563b19adf11d592ca134a8a9e6f24d652ab617b.json', relation: 'CONTRADICTS', primary: 'a0f9e483c7fc425dafa70a775f1d1b9c125e600eaf39349d4498902a33ae0e51' },
];
for (const expected of stableManifests) {
  const local = (await readFile(new URL(`./hosted/a/.well-known/margin/claims/${expected.file}`, import.meta.url), 'utf8')).trim();
  const response = await fetch(`${origin}/.well-known/margin/claims/${expected.file}`, { redirect: 'error' });
  const body = (await response.text()).trim();
  if (!response.ok) throw new Error(`stable manifest ${expected.file}: HTTP ${response.status}`);
  if (body !== local) throw new Error(`stable manifest ${expected.file}: public bytes differ from repository`);
  const manifest = JSON.parse(body);
  if (manifest.primary_artifact_sha256 !== expected.primary) throw new Error(`stable manifest ${expected.file}: unexpected verified GenVM primary digest`);
  if (manifest.evidence_pack?.[0]?.relation !== expected.relation) throw new Error(`stable manifest ${expected.file}: relation mismatch`);
  const evidence = await fetch(manifest.evidence_pack[0].url, { redirect: 'error' });
  const evidenceBody = await evidence.text();
  const item = manifest.evidence_pack[0];
  if (!evidence.ok || sha(evidenceBody) !== item.expected_sha256 || !evidenceBody.includes(item.citation_exact)) throw new Error(`stable manifest ${expected.file}: evidence digest/citation check failed`);
  console.log(`stable manifest ${expected.file} HTTP ${response.status}: exact bytes, ${expected.relation}, evidence digest/citation verified`);
}

const signerResponse = await fetch(`${signerOrigin}/`, { redirect: 'error' });
const signerBody = await signerResponse.text();
if (!signerResponse.ok) throw new Error(`signer: HTTP ${signerResponse.status}`);
if (signerBody.includes('missing VITE_MARGIN_CONTRACT_ADDRESS')) {
  throw new Error('signer: missing VITE_MARGIN_CONTRACT_ADDRESS banner detected');
}
const scriptMatch = signerBody.match(/<script[^>]+src=["']([^"']+)["']/i);
if (!scriptMatch) throw new Error('signer: no JavaScript bundle found in HTML');
const bundleUrl = new URL(scriptMatch[1], signerOrigin).href;
const bundleResponse = await fetch(bundleUrl, { redirect: 'error' });
const bundle = await bundleResponse.text();
if (!bundleResponse.ok) throw new Error(`signer bundle: HTTP ${bundleResponse.status}`);
if (!bundle.includes(canonicalMargin)) {
  throw new Error(`signer bundle: missing canonical MARGIN address ${canonicalMargin}`);
}
if (!bundle.includes(canonicalConsumer)) {
  throw new Error(`signer bundle: missing canonical consumer address ${canonicalConsumer}`);
}
console.log(`${signerOrigin}/ HTTP ${signerResponse.status}: bundle ${bundleUrl} contains canonical V2 addresses; no missing-config banner`);
