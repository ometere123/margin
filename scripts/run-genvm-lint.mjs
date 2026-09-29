import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/run-genvm-lint.mjs lint <contract.py>');
  process.exit(2);
}

const python = process.platform === 'win32' ? 'python' : 'python3';
const child = spawn(
  python,
  ['-c', 'from genvm_linter.cli import cli; cli()', ...args],
  { stdio: 'inherit', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } },
);

child.on('error', (error) => {
  console.error(`Unable to run genvm-lint through ${python}: ${error.message}`);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`genvm-lint terminated by ${signal}`);
    process.exit(1);
  }
  process.exit(code ?? 1);
});
