import { spawnSync } from 'node:child_process';
import process from 'node:process';

const cwd = process.cwd();
let command = 'pytest';
let args = ['tests/direct', '-q'];

if (process.platform === 'win32') {
  const drive = cwd[0].toLowerCase();
  const wslCwd = `/mnt/${drive}${cwd.slice(2).replaceAll('\\', '/')}`;
  command = 'wsl.exe';
  args = ['bash', '-lc', `cd '${wslCwd.replaceAll("'", "'\\''")}' && pytest tests/direct -q`];
}

const result = spawnSync(command, args, { stdio: 'inherit' });
if (result.error) {
  console.error(`Unable to run Direct Mode tests: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
