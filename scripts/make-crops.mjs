// Recortes 4:3 de las fotos reales VERTICALES que van en el hero (src/assets/img/real/recortes/).
// El hero muestra solo una franja horizontal: servir la foto vertical completa era el LCP más
// pesado de la página. Uso: node scripts/make-crops.mjs (a mano; el resultado se versiona).
// [foto, centro vertical del recorte 0–1]
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const SRC = 'src/assets/img/real/';
const OUT = `${SRC}recortes/`;
const jobs = [
  ['invictus-camioneta-atardecer', 0.56],
  ['invictus-guardia-camioneta', 0.42],
  ['invictus-evento-escenario', 0.3],
];

await mkdir(OUT, { recursive: true });
for (const [name, y] of jobs) {
  const src = `${SRC}${name}.jpg`;
  const { width, height } = await sharp(src).metadata();
  const h = Math.round((width * 3) / 4);
  const top = Math.max(0, Math.min(height - h, Math.round(height * y - h / 2)));
  await sharp(src)
    .extract({ left: 0, top, width, height: h })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(`${OUT}${name}-4x3.jpg`);
  console.log('ok', `${OUT}${name}-4x3.jpg`, `${width}x${h}`, `top=${top}`);
}
