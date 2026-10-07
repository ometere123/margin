#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const files = [
  'scripts/live/evidence/V2-supported.json',
  'scripts/live/evidence/V2-supported-positive.json',
  'scripts/live/evidence/V2-supported-text.json',
];
const dryRun = process.argv.includes('--dry-run');

async function run(file) {
  const state = JSON.parse(await readFile(file, 'utf8'));
  const finalStep = state.steps?.[state.steps.length - 1];
  const finalReadback = state.finalReadback?.assured ?? finalStep?.readback?.assured;
  if (finalReadback?.state === 'SETTLED' || finalReadback?.state === 'CANCELLED' || finalReadback?.state === 'ABORTED') {
    return { file, action: 'SKIP_TERMINAL', state: finalReadback.state, status: finalReadback.final_status };
  }
  const deadline = Date.parse(state.appealDeadline ?? '');
  if (!Number.isFinite(deadline) || deadline > Date.now()) {
    return { file, action: 'WAIT', appealDeadline: state.appealDeadline };
  }
  const env = {
    ...process.env,
    MARGIN_V2_CLAIM_KEY: state.claim.key,
    MARGIN_V2_PAGE_KEY: state.claim.pageKey,
    MARGIN_V2_PAGE_URL: state.claim.url,
    MARGIN_V2_PAGE_DIGEST: state.claim.pageDigest,
    MARGIN_V2_PREFIX: state.claim.prefix,
    MARGIN_V2_SUFFIX: state.claim.suffix,
    MARGIN_V2_NONCE: state.claim.nonce,
    MARGIN_V2_CHALLENGE: state.claim.challenge,
    MARGIN_V2_STATE_PATH: file,
  };
  if (dryRun) return { file, action: 'WOULD_RESUME', appealDeadline: state.appealDeadline, claimKey: state.claim.key };
  return await new Promise((resolveResult, reject) => {
    const child = spawn(process.execPath, [resolve('scripts/live/run-v2-covered.mjs')], { env, stdio: 'inherit' });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolveResult({ file, action: 'RESUMED', code }) : reject(new Error(`${file} exited with ${code}`)));
  });
}

const results = [];
for (const file of files) results.push(await run(file));
console.log(JSON.stringify(results, null, 2));
