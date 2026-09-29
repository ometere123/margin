#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';

const margin = '0x0f8D86d56F1b8997475dD048579807fBFe60e227';
const consumer = '0x6Bdb12646e054C24b68012560F7472636b395881';
const rpc = 'https://studio.genlayer.com/api';
const network = 'studionet';

function arg(name, fallback = undefined) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
}

const sequence = arg('sequence');
if (!['A', 'B', 'C'].includes(sequence)) {
  throw new Error('Usage: node scripts/live/run-current-sequences.mjs --sequence A|B|C [--state path]');
}

const statePath = resolve(arg('state', `scripts/live/evidence/${sequence}-pending.json`));
await mkdir(dirname(statePath), { recursive: true });
const now = new Date();
let state = { sequence, network, chainId: 61999, rpc, margin, consumer, status: 'PENDING', startedAt: now.toISOString(), steps: [] };
try { state = { ...state, ...JSON.parse(await readFile(statePath, 'utf8')) }; } catch {}

async function cli(args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['exec', '--', 'genlayer', ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = ''; let stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolvePromise({ stdout, stderr }) : reject(new Error(`${args.join(' ')}\n${stderr || stdout}`)));
  });
}

async function save() {
  await writeFile(statePath, JSON.stringify(state, null, 2) + '\n');
}

state.steps.push({
  at: now.toISOString(),
  action: 'state checkpoint',
  note: 'This runner records only commands and verified CLI receipts. It never retries a write or invents a transaction hash. Supply the wallet/account and claim-specific inputs before adding a step.'
});
await save();

if (sequence === 'C') {
  const earliest = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  state.earliestPossibleAttemptAt = state.earliestPossibleAttemptAt ?? earliest;
  state.status = 'PENDING';
  state.steps.push({ at: now.toISOString(), action: 'register_assured_claim', status: 'PENDING', note: 'Run with a fresh claim, valid HTTPS proof, and publisher wallet; do not cancel before earliestCancelAt.' });
  await save();
  console.log(JSON.stringify(state, null, 2));
  process.exit(0);
}

// A and B deliberately stop at a checkpoint until the operator supplies fresh
// claim/proof/account inputs. This avoids a dangerous blind resubmission.
state.steps.push({ at: now.toISOString(), action: sequence === 'A' ? 'normal → assured lifecycle' : 'protected release lifecycle', status: 'PENDING', note: 'No live writes were run by this invocation.' });
await save();
console.log(JSON.stringify(state, null, 2));
