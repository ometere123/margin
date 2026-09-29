#!/usr/bin/env node
import crypto from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import keytar from 'keytar';
import { createAccount, createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionHashVariant } from 'genlayer-js/types';

const MARGIN = '0x0f8D86d56F1b8997475dD048579807fBFe60e227';
const CONSUMER = '0x6Bdb12646e054C24b68012560F7472636b395881';
const RPC = 'https://studio.genlayer.com/api';
const values = new Map(process.argv.slice(2).reduce((out, value, i, all) => {
  if (value.startsWith('--')) out.push([value.slice(2), all[i + 1] ?? true]);
  return out;
}, []));
const sequence = values.get('sequence');
const dryRun = values.has('dry-run');
if (!['A', 'B', 'C'].includes(sequence)) throw new Error('Use --sequence A|B|C [--dry-run].');

const definitions = {
  A: { path: '/', nonce: 'margin-live-a-20260929', publisher: 'deployer', challenger: 'party_a', quote: 'Every GenLayer transaction reaches consensus through independent validator adjudication before finalization.', challenge: 'Verify that this public statement about GenLayer transaction finalization is accurate.', body: 'GenLayer transaction lifecycle Every GenLayer transaction reaches consensus through independent validator adjudication before finalization. This page is a live MARGIN evidence fixture.', prefix: 'GenLayer transaction lifecycle ' },
  B: { path: '/b.html', nonce: 'margin-live-b-20260929', publisher: 'deployer', challenger: 'party_a', integrator: 'walletA', quote: 'GenLayer validators independently adjudicate transactions before the protocol finalizes them.', challenge: 'Verify that this claim about independent validator adjudication and finalization is supported.', body: 'GenLayer protected release evidence GenLayer validators independently adjudicate transactions before the protocol finalizes them. This page is a live MARGIN evidence fixture.', prefix: 'GenLayer protected release evidence ' },
  C: { path: '/c.html', nonce: 'margin-live-c-20260929', publisher: 'deployer', challenger: 'party_a', quote: 'A finalized GenLayer transaction has passed the protocol consensus lifecycle.', challenge: 'Verify that this statement about the GenLayer consensus lifecycle is accurate.', body: 'GenLayer cancellation evidence A finalized GenLayer transaction has passed the protocol consensus lifecycle. This page is a live MARGIN evidence fixture.', prefix: 'GenLayer cancellation evidence ' },
};
const origin = 'https://a-murex-one.vercel.app';
const evidenceUrl = 'https://genlayer.com/blog/making-genlayer-100-percent-secure-part-1-the-architecture';
const proofExpiry = '2027-01-01T00:00:00+00:00';
const statePath = resolve(`scripts/live/evidence/${sequence}.json`);
const canonicalJson = value => Array.isArray(value) ? `[${value.map(canonicalJson).join(',')}]` : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(',')}}` : JSON.stringify(value);
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
function claim() {
  const d = definitions[sequence]; const canonicalUrl = `${origin}${d.path}`; const suffix = ' This page is a live MARGIN evidence fixture.';
  const pageKey = sha(canonicalUrl); const pageDigest = sha(d.body);
  const payload = { archiveUrl: '', canonicalUrl, challengeStatement: d.challenge, claimClass: 'TECHNICAL', exact: d.quote, evidenceUrls: [evidenceUrl], pageDigest, pageKey, prefix: d.prefix, suffix, v: 1 };
  return { ...d, canonicalUrl, pageKey, pageDigest, suffix, claimKey: sha(canonicalJson(payload)), payload };
}
async function signer(name) {
  const privateKey = await keytar.getPassword('genlayer-cli', `account:${name}`);
  if (!privateKey) throw new Error(`CLI account ${name} is not unlocked.`);
  const account = createAccount(privateKey);
  return { name, address: account.address, client: createClient({ chain: studionet, endpoint: RPC, account }) };
}
async function read(client, address, method, args = []) {
  let delay = 2000;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    try { return await client.readContract({ address, functionName: method, args, transactionHashVariant: TransactionHashVariant.LATEST_FINAL }); } catch (error) {
      if (attempt === 11) throw error;
      await new Promise(resolveDelay => setTimeout(resolveDelay, delay));
      delay = Math.min(15000, Math.round(delay * 1.3));
    }
  }
}
function receiptSummary(receipt) { return { status: receipt.statusName ?? receipt.status_name, consensus: receipt.resultName ?? receipt.result_name, execution: receipt.consensus_data?.leader_receipt?.[0]?.execution_result, hash: receipt.hash ?? receipt.tx_id }; }
async function waitFinalized(client, hash) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const result = await new Promise(resolveReceipt => {
      const child = process.platform === 'win32'
        ? spawn('npm.cmd', ['exec', '--', 'genlayer', 'receipt', hash], { shell: true, stdio: ['ignore', 'pipe', 'pipe'] })
        : spawn('npm', ['exec', '--', 'genlayer', 'receipt', hash], { stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.on('data', chunk => { output += chunk; });
    child.on('error', error => resolveReceipt({ error, output }));
    child.on('close', code => {
      const status = output.match(/status_name:\s*'([^']+)'/)?.[1];
      const consensus = output.match(/result_name:\s*'([^']+)'/)?.[1];
      const leaderBlock = output.match(/leader_receipt:[\s\S]*?execution_result:\s*'([^']+)'/);
      resolveReceipt({ code, status, consensus, execution: leaderBlock?.[1], output });
    });
    });
    if (result.status && result.consensus && result.execution) {
      return { status_name: result.status, result_name: result.consensus, hash, consensus_data: { leader_receipt: [{ execution_result: result.execution }] } };
    }
    if (attempt < 4) await new Promise(resolveDelay => setTimeout(resolveDelay, 3000 * (attempt + 1)));
  }
  throw new Error(`Receipt lookup failed for ${hash}; resume by querying this hash, never resubmit it.`);
}
async function state() { try { return JSON.parse(await readFile(statePath, 'utf8')); } catch { return { sequence, network: 'studionet', chainId: 61999, rpc: RPC, margin: MARGIN, consumer: CONSUMER, steps: [] }; } }
async function save(value) { await mkdir(dirname(statePath), { recursive: true }); await writeFile(statePath, JSON.stringify(value, null, 2) + '\n'); }
async function checkpoint(s, step) { s.steps.push(step); await save(s); }
async function proofMatches(c, publisher) {
  const response = await fetch(`${origin}/.well-known/margin.json`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`domain proof fetch failed: ${response.status}`);
  const p = await response.json();
  if (p.domain !== new URL(origin).host || p.claim_key !== c.claimKey || p.publisher_wallet.toLowerCase() !== publisher.toLowerCase() || p.nonce !== c.nonce) throw new Error(`domain proof does not match ${c.claimKey}`);
}
async function writeStep(s, who, address, method, args, value, readbacks) {
  const verified = await signer(who.name);
  if (verified.address.toLowerCase() !== who.address.toLowerCase()) throw new Error(`account changed before ${method}`);
  const step = { account: who.address, function: method, args, value: String(value), submittedAt: new Date().toISOString() };
  if (dryRun) { await checkpoint(s, { ...step, status: 'DRY_RUN' }); return; }
  const hash = await who.client.writeContract({ address, functionName: method, args, value });
  step.txHash = hash; step.status = 'SUBMITTED'; await checkpoint(s, step);
  const receipt = await waitFinalized(who.client, hash);
  step.finality = receiptSummary(receipt);
  if (step.finality.status !== 'FINALIZED' || step.finality.consensus !== 'MAJORITY_AGREE' || step.finality.execution !== 'SUCCESS') throw new Error(`${method} did not finalize successfully: ${JSON.stringify(step.finality)}`);
  step.readback = {};
  for (const [label, address2, method2, args2] of readbacks) step.readback[label] = await read(who.client, address2, method2, args2);
  s.steps[s.steps.length - 1] = step; await save(s); return step;
}
async function recoverPending(s, publisher, challenger) {
  const pending = [...s.steps].reverse().find(step => step.status === 'SUBMITTED' && step.txHash);
  if (!pending) return;
  const who = [publisher, challenger].find(candidate => candidate.address.toLowerCase() === pending.account.toLowerCase());
  if (!who) throw new Error(`No unlocked signer matches pending ${pending.function}`);
  const receipt = await waitFinalized(who.client, pending.txHash);
  pending.finality = receiptSummary(receipt);
  if (pending.finality.status !== 'FINALIZED' || pending.finality.consensus !== 'MAJORITY_AGREE' || pending.finality.execution !== 'SUCCESS') throw new Error(`Pending ${pending.function} did not finalize successfully: ${JSON.stringify(pending.finality)}`);
  const claimKey = s.claim?.claimKey;
  if (claimKey) pending.readback = { claim: await read(who.client, MARGIN, 'get_claim', [claimKey]), assured: await read(who.client, MARGIN, 'get_assured_claim', [claimKey]) };
  pending.status = 'FINALIZED'; await save(s);
}
async function main() {
  const s = await state(); const c = claim(); const publisher = await signer(definitions[sequence].publisher); const challenger = await signer(definitions[sequence].challenger); const integrator = sequence === 'B' ? await signer(definitions.B.integrator) : null;
  if (publisher.address.toLowerCase() === challenger.address.toLowerCase()) throw new Error('publisher and challenger must be distinct');
  s.publicAccounts = { publisher: publisher.address, challenger: challenger.address, ...(integrator ? { integrator: integrator.address } : {}) }; s.claim = { claimKey: c.claimKey, canonicalUrl: c.canonicalUrl, pageKey: c.pageKey };
  await recoverPending(s, publisher, challenger);
  if (dryRun) { console.log(JSON.stringify({ sequence, claim: c, plan: 'submit → resolve → register → challenge → resolve_assured → wait appeal deadline → settle → withdraw' }, null, 2)); return; }
  if (s.steps.some(x => x.function === 'submit_claim')) {
    const existing = await read(publisher.client, MARGIN, 'get_claim', [c.claimKey]);
    if (!existing?.claim_key) throw new Error('Recorded submit hash exists but canonical claim readback is absent; inspect before resuming.');
  } else await writeStep(s, publisher, MARGIN, 'submit_claim', [c.claimKey, c.pageKey, c.canonicalUrl, c.quote, c.prefix, c.suffix, c.pageDigest, 'TECHNICAL', c.challenge, JSON.stringify([evidenceUrl]), ''], 0n, [['claim', MARGIN, 'get_claim', [c.claimKey]]]);
  if (!s.steps.some(x => x.function === 'resolve_claim')) await writeStep(s, publisher, MARGIN, 'resolve_claim', [c.claimKey], 0n, [['claim', MARGIN, 'get_claim', [c.claimKey]]]);
  if (!s.steps.some(x => x.function === 'register_assured_claim')) {
    await proofMatches(c, publisher.address);
    await writeStep(s, publisher, MARGIN, 'register_assured_claim', [c.claimKey, `${origin}/.well-known/margin.json`, c.nonce, proofExpiry], 1n, [['assured', MARGIN, 'get_assured_claim', [c.claimKey]]]);
  }
  if (sequence === 'B' && !s.steps.some(x => x.function === 'create_protected_release')) await writeStep(s, integrator, CONSUMER, 'create_protected_release', [c.claimKey, publisher.address, '2027-02-01T00:00:00+00:00'], 1n, [['releases', CONSUMER, 'get_releases_for_claim_page', [c.claimKey, 0, 25]]]);
  if (sequence === 'C') {
    const assured = await read(publisher.client, MARGIN, 'get_assured_claim', [c.claimKey]);
    s.earliestCancelAt ??= new Date(Date.parse(assured.state_started_at) + 86400000 + 60000).toISOString(); await save(s);
    if (Date.parse(s.earliestCancelAt) > Date.now()) {
      console.log(JSON.stringify({ status: 'PENDING', earliestCancelAt: s.earliestCancelAt, command: `node scripts/live/resume-C.mjs --state ${statePath}` }, null, 2)); return;
    }
    if (assured.state !== 'REGISTERED' || assured.challenger !== assured.publisher) throw new Error('C cancellation is no longer eligible: claim is challenged or not REGISTERED.');
    if (!s.steps.some(x => x.function === 'cancel_assured_claim')) await writeStep(s, publisher, MARGIN, 'cancel_assured_claim', [c.claimKey], 0n, [['assured', MARGIN, 'get_assured_claim', [c.claimKey]]]);
    const cancelled = await read(publisher.client, MARGIN, 'get_assured_claim', [c.claimKey]);
    if (BigInt(cancelled.publisher_credit ?? 0) > 0n && !s.steps.some(x => x.function === 'withdraw_assured_credit')) await writeStep(s, publisher, MARGIN, 'withdraw_assured_credit', [c.claimKey], 0n, [['assured', MARGIN, 'get_assured_claim', [c.claimKey]]]);
    s.finalReadback = await read(publisher.client, MARGIN, 'get_assured_claim', [c.claimKey]); await save(s); console.log(JSON.stringify(s, null, 2)); return;
  }
  if (!s.steps.some(x => x.function === 'challenge_assured_claim')) await writeStep(s, challenger, MARGIN, 'challenge_assured_claim', [c.claimKey], 1n, [['assured', MARGIN, 'get_assured_claim', [c.claimKey]]]);
  if (!s.steps.some(x => x.function === 'resolve_assured_claim')) await writeStep(s, publisher, MARGIN, 'resolve_assured_claim', [c.claimKey], 0n, [['assured', MARGIN, 'get_assured_claim', [c.claimKey]]]);
  const assured = await read(publisher.client, MARGIN, 'get_assured_claim', [c.claimKey]); s.appealDeadline = assured.appeal_deadline; await save(s);
  if (Date.parse(assured.appeal_deadline) > Date.now()) { console.log(JSON.stringify({ status: 'WAITING_FOR_APPEAL_DEADLINE', appealDeadline: assured.appeal_deadline }, null, 2)); return; }
  if (!s.steps.some(x => x.function === 'settle_assured_claim')) await writeStep(s, publisher, MARGIN, 'settle_assured_claim', [c.claimKey], 0n, [['assured', MARGIN, 'get_assured_claim', [c.claimKey]]]);
  const final = await read(publisher.client, MARGIN, 'get_assured_claim', [c.claimKey]);
  if (sequence === 'B') {
    const releases = await read(integrator.client, CONSUMER, 'get_releases_for_claim_page', [c.claimKey, 0, 25]);
    const release = releases?.[0];
    if (!release) throw new Error('No protected release found after finalized creation.');
    s.release = { releaseId: release.release_id, amount: release.amount, creator: release.creator, beneficiary: release.beneficiary };
    if (final.state === 'SETTLED' && final.final_status === 'SUPPORTED') {
      if (!s.steps.some(x => x.function === 'execute_release')) await writeStep(s, integrator, CONSUMER, 'execute_release', [release.release_id], 0n, [['release', CONSUMER, 'get_release', [release.release_id]], ['supported', MARGIN, 'is_claim_supported', [c.claimKey]]]);
      if (!s.steps.some(x => x.function === 'withdraw_release_credit')) await writeStep(s, publisher, CONSUMER, 'withdraw_release_credit', [release.release_id], 0n, [['release', CONSUMER, 'get_release', [release.release_id]]]);
    } else {
      if (!s.steps.some(x => x.function === 'refund_release')) await writeStep(s, integrator, CONSUMER, 'refund_release', [release.release_id], 0n, [['release', CONSUMER, 'get_release', [release.release_id]]]);
      if (!s.steps.some(x => x.function === 'withdraw_release_credit')) await writeStep(s, integrator, CONSUMER, 'withdraw_release_credit', [release.release_id], 0n, [['release', CONSUMER, 'get_release', [release.release_id]]]);
    }
  }
  for (const [label, who] of [['publisher', publisher], ['challenger', challenger]]) if (BigInt(final[`${label}_credit`] ?? 0) > 0n) await writeStep(s, who, MARGIN, 'withdraw_assured_credit', [c.claimKey], 0n, [['assured', MARGIN, 'get_assured_claim', [c.claimKey]]]);
  s.finalReadback = await read(publisher.client, MARGIN, 'get_assured_claim', [c.claimKey]); await save(s); console.log(JSON.stringify(s, null, 2));
}
await main();
