import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../..', import.meta.url));
const fixtureDir = resolve(root, 'scripts/live/hosted/a');
const projectId = 'prj_xPXHmh3TcvuBDvgSFyTRarWRfJgz';
const expectedDomain = 'a-murex-one.vercel.app';
const link = JSON.parse(readFileSync(resolve(fixtureDir, '.vercel/project.json'), 'utf8'));

if (link.projectId !== projectId || link.projectName === 'margin-signer') {
  throw new Error(`Unexpected fixture Vercel link: ${JSON.stringify(link)}`);
}

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const quote = (value) => process.platform === 'win32'
  ? `"${value.replaceAll('"', '\\"')}"`
  : `'${value.replaceAll("'", "'\\''")}'`;
const commandLine = [
  command,
  'vercel deploy',
  '--cwd', quote(fixtureDir),
  '--project', quote(projectId),
  '--prod',
  '--yes',
  '--force',
  '--scope', quote(link.orgId),
].join(' ');
process.stdout.write(execSync(commandLine, { cwd: root, encoding: 'utf8' }));
console.log(`Expected production fixture domain: https://${expectedDomain}`);
