import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve, dirname, relative, isAbsolute, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.glsl': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.py': 'text/plain; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif', '.mp3': 'audio/mpeg' };

export function createPreviewServer(root = ROOT) {
  return createServer(async (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end(); return; }
    try {
      let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      if (pathname.includes('\\') || pathname.includes('\0')) { res.writeHead(400).end(); return; }
      if (pathname.endsWith('/')) pathname += 'index.html';
      if (!/^\/(index\.html|README\.md|favicon\.ico|themes\/|assets\/|dist\/|modules\/|cases\/|library\/|docs\/|tools\/[a-zA-Z0-9_-]+\.(mjs|py)$)/.test(pathname)) { res.writeHead(404).end(); return; }
      const target = resolve(root, '.' + pathname);
      const local = relative(root, target);
      if (local.startsWith('..' + sep) || local === '..' || isAbsolute(local) || local.split(sep).some(segment => segment.startsWith('.'))) { res.writeHead(403).end(); return; }
      const info = await stat(target);
      if (!info.isFile()) { res.writeHead(404).end(); return; }
      res.writeHead(200, { 'Content-Type': TYPES[extname(target)] || 'application/octet-stream', 'Content-Length': info.size, 'Cache-Control': 'no-cache' });
      if (req.method === 'HEAD') res.end();
      else createReadStream(target).on('error', () => res.destroy()).pipe(res);
    } catch (error) {
      res.writeHead(error instanceof URIError ? 400 : 404).end('Not found');
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4178);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535');
  const server = createPreviewServer();
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`Train Wallpapers: http://127.0.0.1:${port}/`));
}
