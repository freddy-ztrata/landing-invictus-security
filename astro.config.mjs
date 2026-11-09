// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Build liviano (el servidor de Dokploy cancelaba el deploy por CPU/RAM): Astro 7 procesa las
// imágenes en una cola fija de os.availableParallelism() y no expone cómo limitarla, pero sí
// podemos acotar libvips (mismo módulo `sharp` que usa el servicio de imágenes de Astro):
// 1 hilo por imagen y sin caché de operaciones → menos picos de CPU y de memoria.
// sharp llega como dependencia de astro (no es directa): import opcional, nunca rompe el build.
try {
  const { default: sharp } = await import('sharp');
  sharp.concurrency(1);
  sharp.cache(false);
} catch {
  /* sin sharp accesible: se usan los valores por defecto */
}

// Páginas que no van al sitemap (noindex vía X-Robots-Tag en nginx y meta robots).
const NOINDEX = /\/(gracias|privacidad)\/$/;

export default defineConfig({
  site: 'https://invictussecurity.cl',
  output: 'static',
  // Directorios + barra final: /guardias-de-seguridad/ → dist/guardias-de-seguridad/index.html.
  // nginx hace el 301 nativo /foo → /foo/ conservando el query string (gclid).
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'always',
  },
  // v7 cambió el default a 'jsx', que borra espacios entre elementos inline y rompe el copy.
  compressHTML: true,
  // MPA a propósito: nada de <ClientRouter/> (rompería el page_view de GTM).
  prefetch: false,
  integrations: [
    sitemap({
      filter: (page) => !NOINDEX.test(page),
    }),
  ],
  image: {
    // Solo WebP (+ un JPG de fallback por foto) generados en build por sharp; sin AVIF (build pesado).
    responsiveStyles: true,
  },
  vite: {
    build: {
      // Assets pequeños inline; el resto con hash en /_astro/ (cache 1 año immutable).
      assetsInlineLimit: 2048,
    },
  },
});
