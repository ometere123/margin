import { build } from 'esbuild';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await build({
  entryPoints: ['src/main.ts'],
  outfile: 'dist/index.js',
  bundle: true,
  platform: 'node',
  target: 'node24',
  format: 'cjs',
  sourcemap: false,
  minify: true,
  legalComments: 'none',
});
const bundled = await readFile('dist/index.js', 'utf8');
await writeFile('dist/index.js', bundled.replace(/[ \t]+$/gm, ''), 'utf8');
console.log('Built MARGIN release-gate action.');
