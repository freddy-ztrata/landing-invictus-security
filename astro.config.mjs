// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

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
    // AVIF + WebP generados en build por sharp.
    responsiveStyles: true,
  },
  vite: {
    build: {
      // Assets pequeños inline; el resto con hash en /_astro/ (cache 1 año immutable).
      assetsInlineLimit: 2048,
    },
  },
});
