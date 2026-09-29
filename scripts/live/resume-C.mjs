#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
const path = process.argv[2] ?? 'scripts/live/evidence/C-pending.json';
const state = JSON.parse(await readFile(path, 'utf8'));
if (!state.earliestPossibleAttemptAt) throw new Error('No pending C sequence found. Start it with run-current-sequences.mjs --sequence C.');
const remaining = Date.parse(state.earliestPossibleAttemptAt) - Date.now();
if (remaining > 0) {
  console.log(JSON.stringify({ ...state, status: 'PENDING', remainingMs: remaining }, null, 2));
  process.exit(0);
}
state.steps ??= [];
state.steps.push({ at: new Date().toISOString(), action: 'cancel_assured_claim', status: 'READY_FOR_OPERATOR', note: 'Verify the claim is still REGISTERED and unchallenged, then submit the write with the publisher wallet. Record the finalized receipt before withdrawing credit.' });
await writeFile(path, JSON.stringify(state, null, 2) + '\n');
console.log(JSON.stringify(state, null, 2));
