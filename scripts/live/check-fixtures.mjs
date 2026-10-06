import { readFile } from 'node:fs/promises';

const origin = 'https://a-murex-one.vercel.app';
const signerOrigin = 'https://margin-signer.vercel.app';
const canonicalMargin = '0x03197B3246a5BF0C28fad07c4E5868F52c601580';
const canonicalConsumer = '0x59ef05cd7e136A66Ee16AE70776a0ddf2d036E24';
const checks = [
  ['/', 'Every GenLayer transaction reaches consensus through independent validator adjudication before finalization.', 'MARGIN live claim A'],
  ['/b.html', 'GenLayer validators independently adjudicate transactions before the protocol finalizes them.', 'MARGIN live claim B'],
  ['/c.html', 'A finalized GenLayer transaction has passed the protocol consensus lifecycle.', 'MARGIN live claim C'],
];

const proofPath = new URL('./hosted/a/.well-known/margin.json', import.meta.url);
const expectedProof = (await readFile(proofPath, 'utf8')).trim();

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
