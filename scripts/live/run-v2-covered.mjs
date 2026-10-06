#!/usr/bin/env node
import crypto from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import keytar from 'keytar';
import { createAccount, createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionHashVariant } from 'genlayer-js/types';

const MARGIN = '0x03197B3246a5BF0C28fad07c4E5868F52c601580';
const CONSUMER = '0x59ef05cd7e136A66Ee16AE70776a0ddf2d036E24';
const RPC = 'https://studio.genlayer.com/api';
const ORIGIN = 'https://a-murex-one.vercel.app';
const CLAIM = {
  key: '327d4778e40708a227e26c52108830b035453d8eaf4e3ab0588150c212c20698',
  pageKey: '8b6553dc8c53ae90e6a09617b7e20232eb68035850be8e5dfb63d842776fe7af',
  url: `${ORIGIN}/v2-support.html`,
  quote: 'The MARGIN protocol records finalized evidence commitments before a Covered Claim can protect value.',
  prefix: 'Covered Claim evidence: ',
  suffix: ' This statement is published as a V2 evidence fixture.',
  pageDigest: '146e27235c63aed2ec7d1ec3b55b88772afbce5586c65baea477ddb388c88d00',
  challenge: 'Verify that this Covered Claim evidence commitment and value coverage statement is supported.',
  evidence: 'https://a-murex-one.vercel.app/v2-evidence.txt',
  nonce: 'margin-v2-covered-20261006',
  expiry: '2027-01-01T00:00:00+00:00',
};
const statePath = resolve('scripts/live/evidence/V2-covered.json');
const dryRun = process.argv.includes('--dry-run');
const sha = (value) => crypto.createHash('sha256').update(value).digest('hex');

async function save(state) {
  await mkdir(dirname(statePath), { recursive: true });
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`);
}
async function load() {
  try { return JSON.parse(await readFile(statePath, 'utf8')); } catch {
    return { network: 'studionet', chainId: 61999, rpc: RPC, margin: MARGIN, consumer: CONSUMER, claim: CLAIM, steps: [] };
  }
}
async function account(name) {
  const privateKey = await keytar.getPassword('genlayer-cli', `account:${name}`);
  if (!privateKey) throw new Error(`CLI account ${name} is not unlocked`);
  const signer = createAccount(privateKey);
  return { name, address: signer.address, client: createClient({ chain: studionet, endpoint: RPC, account: signer }) };
}
async function readFinal(client, address, functionName, args = []) {
  let delay = 1500;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try { return await client.readContract({ address, functionName, args, transactionHashVariant: TransactionHashVariant.LATEST_FINAL }); }
    catch (error) { if (attempt === 9) throw error; await new Promise((resolveDelay) => setTimeout(resolveDelay, delay)); delay = Math.min(12000, Math.round(delay * 1.4)); }
  }
}
function runReceipt(hash) {
  return new Promise((resolveReceipt) => {
    const child = process.platform === 'win32'
      ? spawn('npm.cmd', ['exec', '--', 'genlayer', 'receipt', hash], { shell: true, stdio: ['ignore', 'pipe', 'pipe'] })
      : spawn('npm', ['exec', '--', 'genlayer', 'receipt', hash], { stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.on('data', (chunk) => { output += chunk; });
    child.on('close', (code) => resolveReceipt({ code, output }));
  });
}
async function waitFinal(hash) {
  let delay = 2500;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const result = await runReceipt(hash);
    const status = result.output.match(/status_name:\s*'([^']+)'/)?.[1];
    const consensus = result.output.match(/result_name:\s*'([^']+)'/)?.[1];
    const execution = result.output.match(/leader_receipt:[\s\S]*?execution_result:\s*'([^']+)'/)?.[1];
    if (status === 'FINALIZED') return { status, consensus, execution, txHash: hash };
    await new Promise((resolveDelay) => setTimeout(resolveDelay, delay)); delay = Math.min(30000, Math.round(delay * 1.3));
  }
  throw new Error(`Could not confirm FINALIZED for ${hash}; inspect this hash before resuming.`);
}
async function step(state, who, address, functionName, args, value, readbacks) {
  const existing = state.steps.find((item) => item.function === functionName);
  if (existing?.txHash) {
    if (existing.status !== 'FINALIZED') {
      existing.finality = await waitFinal(existing.txHash);
      if (existing.finality.status !== 'FINALIZED' || existing.finality.consensus !== 'MAJORITY_AGREE' || existing.finality.execution !== 'SUCCESS') throw new Error(`${functionName} did not finalize successfully: ${JSON.stringify(existing.finality)}`);
      existing.readback = {};
      for (const [label, target, method, callArgs] of readbacks) existing.readback[label] = await readFinal(who.client, target, method, callArgs);
      existing.status = 'FINALIZED'; await save(state);
    }
    return existing;
  }
  const entry = { account: who.address, function: functionName, args, value: String(value), submittedAt: new Date().toISOString() };
  if (dryRun) { entry.status = 'DRY_RUN'; state.steps.push(entry); await save(state); return entry; }
  const txHash = await who.client.writeContract({ address, functionName, args, value });
  entry.txHash = txHash; entry.status = 'SUBMITTED'; state.steps.push(entry); await save(state);
  entry.finality = await waitFinal(txHash);
  if (entry.finality.status !== 'FINALIZED' || entry.finality.consensus !== 'MAJORITY_AGREE' || entry.finality.execution !== 'SUCCESS') throw new Error(`${functionName} did not finalize successfully: ${JSON.stringify(entry.finality)}`);
  entry.readback = {};
  for (const [label, target, method, callArgs] of readbacks) entry.readback[label] = await readFinal(who.client, target, method, callArgs);
  entry.status = 'FINALIZED'; await save(state); return entry;
}
async function main() {
  const state = await load();
  const publisher = await account('party_a');
  const challenger = await account('party_b');
  const integrator = await account('walletA');
  state.publicAccounts = { publisher: publisher.address, challenger: challenger.address, integrator: integrator.address };
  if (new Set(Object.values(state.publicAccounts).map((value) => value.toLowerCase())).size !== 3) throw new Error('V2 sequence requires three distinct accounts');
  if (dryRun) { console.log(JSON.stringify({ statePath, claim: CLAIM, plan: 'submit → normal resolve → register Covered → create release → challenge → assured resolve → wait appeal deadline → settle → execute/withdraw' }, null, 2)); return; }
  await step(state, publisher, MARGIN, 'submit_claim', [CLAIM.key, CLAIM.pageKey, CLAIM.url, CLAIM.quote, CLAIM.prefix, CLAIM.suffix, CLAIM.pageDigest, 'TECHNICAL', CLAIM.challenge, JSON.stringify([CLAIM.evidence]), ''], 0n, [['claim', MARGIN, 'get_claim', [CLAIM.key]]]);
  await step(state, publisher, MARGIN, 'resolve_claim', [CLAIM.key], 0n, [['claim', MARGIN, 'get_claim', [CLAIM.key]]]);
  await step(state, publisher, MARGIN, 'register_covered_claim', [CLAIM.key, CLAIM.nonce, CLAIM.expiry], 2n, [['covered', MARGIN, 'get_covered_claim', [CLAIM.key]], ['coverage', MARGIN, 'get_coverage_state', [CLAIM.key]]]);
  await step(state, integrator, CONSUMER, 'create_protected_release', [CLAIM.key, publisher.address, '2027-02-01T00:00:00+00:00'], 1n, [['releases', CONSUMER, 'get_releases_for_claim_page', [CLAIM.key, 0, 25]], ['coverage', MARGIN, 'get_coverage_state', [CLAIM.key]]]);
  await step(state, challenger, MARGIN, 'challenge_assured_claim', [CLAIM.key], 2n, [['assured', MARGIN, 'get_assured_claim', [CLAIM.key]], ['covered', MARGIN, 'get_covered_claim', [CLAIM.key]]]);
  await step(state, publisher, MARGIN, 'resolve_assured_claim', [CLAIM.key], 0n, [['assured', MARGIN, 'get_assured_claim', [CLAIM.key]], ['covered', MARGIN, 'get_covered_claim', [CLAIM.key]]]);
  const assured = await readFinal(publisher.client, MARGIN, 'get_assured_claim', [CLAIM.key]);
  state.appealDeadline = assured.appeal_deadline; await save(state);
  if (Date.parse(assured.appeal_deadline) > Date.now()) { console.log(JSON.stringify({ status: 'WAITING_FOR_APPEAL_DEADLINE', appealDeadline: assured.appeal_deadline, statePath }, null, 2)); return; }
  await step(state, publisher, MARGIN, 'settle_assured_claim', [CLAIM.key], 0n, [['assured', MARGIN, 'get_assured_claim', [CLAIM.key]], ['coverage', MARGIN, 'get_coverage_state', [CLAIM.key]]]);
  const final = await readFinal(publisher.client, MARGIN, 'get_assured_claim', [CLAIM.key]);
  const releases = await readFinal(integrator.client, CONSUMER, 'get_releases_for_claim_page', [CLAIM.key, 0, 25]);
  const release = releases?.[0]; if (!release) throw new Error('No release found after finalized creation');
  state.releaseId = release.release_id; await save(state);
  if (final.state === 'SETTLED' && final.final_status === 'SUPPORTED') {
    await step(state, integrator, CONSUMER, 'execute_release', [release.release_id], 0n, [['release', CONSUMER, 'get_release', [release.release_id]], ['supported', CONSUMER, 'is_claim_supported', [CLAIM.key]]]);
    await step(state, publisher, CONSUMER, 'withdraw_release_credit', [release.release_id], 0n, [['release', CONSUMER, 'get_release', [release.release_id]]]);
  } else {
    await step(state, integrator, CONSUMER, 'refund_release', [release.release_id], 0n, [['release', CONSUMER, 'get_release', [release.release_id]]]);
    await step(state, integrator, CONSUMER, 'withdraw_release_credit', [release.release_id], 0n, [['release', CONSUMER, 'get_release', [release.release_id]]]);
  }
  for (const [label, who] of [['publisher', publisher], ['challenger', challenger]]) {
    const current = await readFinal(who.client, MARGIN, 'get_assured_claim', [CLAIM.key]);
    if (BigInt(current[`${label}_credit`] ?? 0) > 0n) await step(state, who, MARGIN, 'withdraw_assured_credit', [CLAIM.key], 0n, [['assured', MARGIN, 'get_assured_claim', [CLAIM.key]]]);
  }
  state.finalReadback = { assured: await readFinal(publisher.client, MARGIN, 'get_assured_claim', [CLAIM.key]), coverage: await readFinal(publisher.client, MARGIN, 'get_coverage_state', [CLAIM.key]), release: await readFinal(publisher.client, CONSUMER, 'get_release', [state.releaseId]) };
  await save(state); console.log(JSON.stringify(state, null, 2));
}
await main();
