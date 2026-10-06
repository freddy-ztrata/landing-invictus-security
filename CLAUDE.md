# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Google Ads landing page for **Invictus Security**, a private security company in Chile (guardias de seguridad privada, OS-10 certified). Static HTML site deployed via Docker/Nginx on Dokploy. Since 2026-10-05 it replaces the client's old WordPress on the **main domain** and it IS indexable (no `noindex`, `robots.txt` allows all, `sitemap.xml` declared). Google Ads penalised the previous `noindex` with "Landing page experience: below average" on 100% of keywords, so never reintroduce crawl blocks.

Production URL: `https://invictussecurity.cl/` (canonical). `www.` and the old `seguridad.` subdomain 301 to it (nginx `server_name` block; both hosts must stay registered as domains of the Dokploy app so Traefik routes them).

## Architecture

- **`invictus-landing.html`** — Main landing page: HTML + CSS (`<style>`) + vanilla JS (`<script>`). No frameworks, no build step. ~110 KB / ~2200 lines, all inline.
  - Two hapee form instances: `#cotizar` (compact card right under the hero, iframe id `inline-top-…`) and `#formulario` (full section near the end, iframe id `inline-…`). Ids must stay distinct for hapee's resize script. Hero CTA → `#cotizar`; every other CTA → `#formulario`.
  - `.cta-inline` strips (button + phone) close 5 sections: Solución, 3 pasos, Servicios, OS-10 (`--dark` variant), Testimonios. Added 2026-10-05 after the Ads audit (mobile converted 0.04% vs desktop 2.5%).
  - All tap targets are ≥44px (`.top-bar-badge`, `.link-privacidad`, `.footer-tel`, floating bar 52px). Keep that when restyling.
  - `#floatingBadge`: on desktop a single "Cotizar Gratis" pill; at ≤768px it becomes a fixed bottom bar with `Llamar ahora` (`tel:`, `data-track="call"`) + `Cotizar Gratis`, and `body` gets `padding-bottom: 76px`.
- **`gracias.html`** — Thank-you page. Loaded after form submission (see Form below). Fires Google Ads conversion event on load: `gtag('event', 'conversion', {send_to: 'AW-17648531850/OcKZCPrpu50cEIrzvN9B'})`.
- **`404.html`** — Custom 404 served by nginx for unknown paths.
- **`robots.txt`** — `Allow: /` + `Sitemap:` line. **`sitemap.xml`** lists `/` and `/privacidad.html`.
- **`assets/img/`** — Logos, service photos, favicons, OG image, hero WebP.
- **`Dockerfile` + `nginx.conf`** — Production deployment via nginx:alpine.
- **`.agents/`, `.claude/`, `node_modules/`** — Gitignored. `skills-lock.json` is also untracked locally.

## Development

```bash
# Local dev server
npx serve . -l 3000
# Then open http://localhost:3000/invictus-landing.html

# Docker build (matches Dokploy deployment)
docker build -t invictus-landing .
docker run -p 8080:80 invictus-landing
# Then open http://localhost:8080/
```

## Deployment

Hosted on Dokploy via GitHub auto-deploy. Build type: **Dockerfile** (not Nixpacks). Every push to `main` triggers a new deployment.

## Nginx behavior (matters when adding routes)

`nginx.conf` does NOT fall back to the landing page for unknown paths — `try_files $uri $uri/ =404` returns a real 404. Consequences:

- Adding a new page (e.g. `oferta.html`) requires nothing more than committing the file; it's served at `/oferta.html`.
- Pretty URLs (e.g. `/oferta` without `.html`) need an explicit `location` block in `nginx.conf`.
- Legacy WordPress routes (`/servicios`, `/service/*`, `/contacto`, `/nosotros`, `/sobre-nosotros`, …) 301 to `/` or the matching anchor; `wp-*` paths return 410. Ads sitelinks may still point at them, so keep these redirects.
- Host canonicalisation lives in a separate `server` block at the top of `nginx.conf` (`www.` and `seguridad.` → 301 `https://invictussecurity.cl$request_uri`). Traefik passes the original `Host`, so `server_name` matching works behind Dokploy.
- `robots.txt` and `404.html` work because they exist as real files.

Security headers (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) and `Cache-Control: max-age=300` for HTML are set in nginx.conf — keep them when editing.

## Form: hapee.ai iframe + redirect

The form is a hapee.ai (GoHighLevel-based) iframe at `<section id="formulario">`. Form ID: `bdjfSIhq3trsUkZf9IgB`. On successful submission, hapee.ai posts a message via `window.postMessage`; a listener in `invictus-landing.html` (search `HAPEE.AI FORM → REDIRECT`) validates the origin and redirects to `/gracias`. Conversion tracking fires on the `gracias.html` page load, NOT on form submit — this avoids losing conversions if the user closes the tab before redirect.

To change the form: replace the iframe `src` and the `data-layout-iframe-id` (must match form ID for hapee.ai's resize script).

## Tracking (already wired)

- **GTM container**: `GTM-WNTMK96Q` (head + noscript fallback in body of all 3 pages)
- **gtag.js direct**: `G-VWCD5DSP40` (GA4) and `AW-17648531850` (Google Ads) — loaded alongside GTM. There may be duplication if GTM also fires GA4/Ads tags; verify in tagmanager.google.com before adding new tracking.
- **Conversion event**: in `gracias.html` only, send_to `AW-17648531850/OcKZCPrpu50cEIrzvN9B`.
- **Eventos `dg_` (convención Digitals)** en `invictus-landing.html`:
  - `dg_whatsapp` — listener sobre `[data-track="whatsapp"]`. **Sin elementos activos**: el botón flotante de WhatsApp se removió (2026-09-08, decisión del cliente); el badge flotante solo tiene "Cotizar Gratis" → `#formulario`. El listener queda por si se reincorpora un CTA de WhatsApp.
  - `dg_formulario` — al recibir `form_submitted` del iframe de hapee.ai, antes de redirigir a `/gracias`.
  - Helper `gtagSendEvent(url, eventName, params)` en el head: envía el evento y navega en el `event_callback` (timeout 2s + `setTimeout` de respaldo si gtag no responde). Un solo helper con el nombre del evento como parámetro — dos funciones `gtagSendEvent()` homónimas se pisarían.
  - Los `dataLayer.push` legacy (`whatsapp_click`, `call_click`) siguen ahí para los triggers de GTM. `dg_formulario` NO se pushea a dataLayer para no duplicar con la conversión de `gracias.html`.
- **Placeholders**: search `META PIXEL` and `HOTJAR / CLARITY` in `invictus-landing.html` head for paste targets.

## Key Design Decisions

- **Paleta**: Negro (#0A0A0A) for hero/CTA/OS-10 sections, Blanco (#FFFFFF) and Gris (#F5F5F5) alternating for body sections, Naranja (#FA360A / #FF5E17) as accent.
- **Logo**: Uses `filter: brightness(0) invert(1)` on dark backgrounds (top bar, gracias/404), original on light backgrounds (footer).
- **Typography**: Sora (headings) + DM Sans (body) via Google Fonts, with `preconnect` to fonts.googleapis.com and fonts.gstatic.com.
- **Hero canvas effect**: "Security Grid Scanner" — animated particle grid with radar sweep and scan line, responds to mouse movement. Vanilla JS on `<canvas>`.
- **Hero LCP image**: `decorativo.png` (909 KB) is served via `<picture>` with `decorativo.webp` (55 KB) source, plus `fetchpriority="high"` and `decoding="async"`. Don't undo this when editing.
- **No external links or navigation** — Google Ads landing page best practice for Quality Score. The only `<a href>` targets are `#formulario` (anchor) and `/gracias` (post-conversion).

## SEO Configuration

- The page is **indexable** (no `<meta name="robots">` at all; default index/follow). It was `noindex` until 2026-10-05 and Google Ads rated the landing page experience "below average" on every keyword because of it. Do NOT add `noindex` or `Disallow` again. `gracias.html`, `404.html` and `privacidad.html` keep their own `noindex`.
- Canonical: `https://invictussecurity.cl/`. OG/Twitter image and Schema `url`/`logo`/`image` must use that same host (never `seguridad.` nor `www.`, both 301 and break social previews).
- Schema.org `SecurityService` JSON-LD includes telephone `+56957620565`, email `comercial@invictussecurity.cl`, geo (Peñaflor lat/lon), and openingHours Mon-Fri 09:00-19:00 — these are invisible to users but provide structured data for crawlers without distracting from the form.
- `sitemap.xml` lists `/` and `/privacidad.html` and is declared in `robots.txt`. After a deploy that changes indexing, request re-indexing in Search Console (URL Inspector on `https://invictussecurity.cl/`).
