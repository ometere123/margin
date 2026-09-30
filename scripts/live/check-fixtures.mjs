import { readFile } from 'node:fs/promises';

const origin = 'https://a-murex-one.vercel.app';
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

const signerResponse = await fetch('https://margin-signer.vercel.app/', { redirect: 'error' });
const signerBody = await signerResponse.text();
if (!signerResponse.ok) throw new Error(`signer: HTTP ${signerResponse.status}`);
if (signerBody.includes('missing VITE_MARGIN_CONTRACT_ADDRESS')) {
  throw new Error('signer: missing VITE_MARGIN_CONTRACT_ADDRESS banner detected');
}
console.log(`https://margin-signer.vercel.app/ HTTP ${signerResponse.status}: no missing-config banner`);
