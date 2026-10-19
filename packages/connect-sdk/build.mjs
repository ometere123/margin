import { build } from 'esbuild';
import { rm } from 'node:fs/promises';

await rm(new URL('./dist/', import.meta.url), { recursive: true, force: true });

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  bundle: false,
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  sourcemap: true,
  packages: 'external',
});

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.cjs',
  bundle: false,
  format: 'cjs',
  platform: 'node',
  target: 'node20',
  sourcemap: true,
  packages: 'external',
});

console.log('Built @margin-connect/sdk ESM and CJS distributions.');
