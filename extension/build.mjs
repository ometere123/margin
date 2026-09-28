import { build } from 'esbuild';
import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));
const out = resolve(root, 'dist');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(resolve(root, 'public'), out, { recursive: true });

for (const entry of ['background','content','sidepanel','options']) {
  await build({
    entryPoints: [resolve(root, `src/${entry}.ts`)],
    outfile: resolve(out, `${entry}.js`),
    bundle: true,
    format: 'esm',
    target: ['chrome114'],
    sourcemap: false,
    minify: false,
    logLevel: 'warning',
  });
}
console.log(`Built extension -> ${out}`);
