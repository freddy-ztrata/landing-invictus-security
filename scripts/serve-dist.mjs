// Servidor local de dist/ que imita el comportamiento de nginx en producción:
// - 301 /foo → /foo/ conservando el query string; index.html por directorio; 404.html
// - POST /api/lead simulado (MOCK_LEAD=fail → 502 {"ok":false}, para probar el respaldo)
// Uso: npm run build && npm run preview   (PORT=4321 por defecto)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const ROOT = join(process.cwd(), 'dist');
const PORT = Number(process.env.PORT || 4321);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml' };
export const leads = [];

async function tryFile(p) {
  try { const s = await stat(p); return s.isFile() ? p : s.isDirectory() ? 'DIR' : null; } catch { return null; }
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/lead') {
    if (req.method !== 'POST') { res.writeHead(405).end(); return; }
    let body = '';
    for await (const chunk of req) body += chunk;
    leads.push(body);
    console.log('[api/lead]', body.slice(0, 300));
    if (process.env.MOCK_LEAD === 'fail') { res.writeHead(502, { 'Content-Type': 'application/json' }).end('{"ok":false}'); return; }
    res.writeHead(200, { 'Content-Type': 'application/json' }).end('{"ok":true}');
    return;
  }
  const safe = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  let p = join(ROOT, safe);
  const hit = await tryFile(p);
  if (hit === 'DIR') {
    if (!url.pathname.endsWith('/')) { res.writeHead(301, { Location: url.pathname + '/' + url.search }).end(); return; }
    p = join(p, 'index.html');
  }
  try {
    const data = await readFile(p);
    res.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' }).end(data);
  } catch {
    const nf = await readFile(join(ROOT, '404.html')).catch(() => Buffer.from('404'));
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }).end(nf);
  }
}).listen(PORT, () => console.log(`dist/ en http://localhost:${PORT}`));
