#!/usr/bin/env node
// Resume the real C sequence. The shared runner derives the deadline from
// finalized registration state and never submits before that deadline.
const { spawn } = await import('node:child_process');
const child = spawn(process.execPath, ['scripts/live/run-current-sequences.mjs', '--sequence', 'C', '--resume'], { stdio: 'inherit' });
child.on('exit', code => process.exit(code ?? 1));
