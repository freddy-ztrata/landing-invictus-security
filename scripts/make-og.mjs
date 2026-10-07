// Genera las imágenes Open Graph (1200×630) en public/img/og/ a partir de las fotos del sitio.
// Uso: node scripts/make-og.mjs   (se ejecuta a mano cuando cambian las fotos; el resultado se versiona)
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const OUT = 'public/img/og';
const jobs = [
  ['home', 'src/assets/img/gen/hero-guardias-equipo.jpg', 'right'],
  ['condominios', 'src/assets/img/gen/condominio-conserjeria.jpg', 'centre'],
  ['eventos', 'src/assets/img/gen/evento-control-acceso.jpg', 'centre'],
  ['empresas', 'src/assets/img/gen/empresa-bodega-acceso.jpg', 'centre'],
  ['guardias', 'src/assets/img/gen/hero-condominio-andes.jpg', 'right'],
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
for (const [name, src, position] of jobs) {
  await sharp(src)
    .resize(W, H, { fit: 'cover', position })
    .composite([
      { input: shade, top: 0, left: 0 },
      { input: logo, top: 64, left: 64 },
    ])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(`${OUT}/${name}.jpg`);
  console.log('ok', `${OUT}/${name}.jpg`);
}
