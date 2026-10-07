// Precomprime con gzip (nivel 9) los archivos de texto de dist/ para nginx `gzip_static on`.
// Uso: node scripts/precompress.mjs dist
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { gzipSync, constants } from 'node:zlib';

const root = process.argv[2] || 'dist';
const EXT = new Set(['.html', '.css', '.js', '.mjs', '.svg', '.txt', '.xml', '.json', '.webmanifest']);
let count = 0;
let saved = 0;

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) await walk(p);
    else if (EXT.has(extname(entry.name)) && (await stat(p)).size > 1024) {
      const buf = await readFile(p);
      const gz = gzipSync(buf, { level: constants.Z_BEST_COMPRESSION });
      if (gz.length < buf.length * 0.9) {
        await writeFile(p + '.gz', gz);
        count++;
        saved += buf.length - gz.length;
      }
    }
  }
}

await walk(root);
console.log(`precompress: ${count} archivos .gz (−${Math.round(saved / 1024)} KB)`);
