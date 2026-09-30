import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const signerDist = join(root, 'signer', 'dist');
const fixture = join(root, 'tests', 'browser', 'fixture.html');
const hostileFixture = join(root, 'tests', 'browser', 'hostile.html');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.png': 'image/png' };

createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url || '/', 'http://localhost').pathname;
    const target = pathname === '/fixture.html'
      ? fixture
      : pathname === '/hostile.html'
        ? hostileFixture
      : join(signerDist, pathname === '/' || !extname(pathname) ? 'index.html' : normalize(pathname).replace(/^[/\\]+/, ''));
    const body = await readFile(target);
    res.writeHead(200, { 'content-type': types[extname(target)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
  }
}).listen(4173, '127.0.0.1');
