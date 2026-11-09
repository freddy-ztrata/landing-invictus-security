// Genera las imágenes Open Graph (1200×630) en public/img/og/ a partir de las fotos del sitio.
// Uso: node scripts/make-og.mjs   (se ejecuta a mano cuando cambian las fotos; el resultado se versiona)
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const OUT = 'public/img/og';
// Fotos REALES del cliente (src/assets/img/real/). Solo fotos SIN marcas de terceros: la OG
// se comparte fuera del sitio y no depende del flag de vista previa (src/data/fotos-reales.ts).
// position: keyword de sharp o un desplazamiento vertical 0–1 para las fotos verticales.
const R = 'src/assets/img/real/invictus-';
const jobs = [
  ['home', `${R}hero-flota.jpg`, 'centre'],
  ['condominios', `${R}guardia-camioneta.jpg`, 0.4],
  ['eventos', `${R}evento-escenario.jpg`, 0.3],
  ['empresas', `${R}camioneta-atardecer.jpg`, 0.58],
  ['guardias', `${R}equipo-camioneta.jpg`, 'top'],
];

const W = 1200;
const H = 630;
const shade = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#0a0a0a" stop-opacity="0.9"/>
      <stop offset="0.55" stop-color="#0a0a0a" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#0a0a0a" stop-opacity="0.1"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <rect x="0" y="${H - 8}" width="${W}" height="8" fill="#ff5e17"/>
</svg>`);

// Logo negro sobre transparente → blanco
const logo = await sharp('src/assets/img/logo-invictus.png')
  .resize({ width: 460 })
  .negate({ alpha: false })
  .png()
  .toBuffer();

await mkdir(OUT, { recursive: true });
// Recorte 1200×630 centrado en `y` (0 = arriba, 1 = abajo) para fotos verticales.
async function cropAt(src, y) {
  const { width, height } = await sharp(src).metadata();
  const h = Math.round((width * H) / W);
  const top = Math.max(0, Math.min(height - h, Math.round(height * y - h / 2)));
  return sharp(src).extract({ left: 0, top, width, height: h }).toBuffer();
}

for (const [name, src, position] of jobs) {
  const input = typeof position === 'number' ? await cropAt(src, position) : src;
  await sharp(input)
    .resize(W, H, { fit: 'cover', position: typeof position === 'number' ? 'centre' : position })
    .composite([
      { input: shade, top: 0, left: 0 },
      { input: logo, top: 64, left: 64 },
    ])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(`${OUT}/${name}.jpg`);
  console.log('ok', `${OUT}/${name}.jpg`);
}
