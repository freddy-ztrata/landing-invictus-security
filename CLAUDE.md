# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Google Ads landing page for **Invictus Security**, a private security company in Chile (guardias de seguridad privada, OS-10 certified). Static HTML site deployed via Docker/Nginx on Dokploy. The page is intentionally `noindex, nofollow` — it exists to receive paid traffic and convert via form submission, not for organic SEO.

Production URL: `https://seguridad.invictussecurity.cl/`

## Architecture

- **`invictus-landing.html`** — Main landing page: HTML + CSS (`<style>`) + vanilla JS (`<script>`). No frameworks, no build step. ~99 KB / ~2000 lines, all inline.
- **`gracias.html`** — Thank-you page. Loaded after form submission (see Form below). Fires Google Ads conversion event on load: `gtag('event', 'conversion', {send_to: 'AW-17648531850/OcKZCPrpu50cEIrzvN9B'})`.
- **`404.html`** — Custom 404 served by nginx for unknown paths.
- **`robots.txt`** — `Disallow: /` (consistent with `noindex` meta).
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
- `robots.txt` and `404.html` work because they exist as real files.

Security headers (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) and `Cache-Control: max-age=300` for HTML are set in nginx.conf — keep them when editing.

## Form: hapee.ai iframe + redirect

The form is a hapee.ai (GoHighLevel-based) iframe at `<section id="formulario">`. Form ID: `bdjfSIhq3trsUkZf9IgB`. On successful submission, hapee.ai posts a message via `window.postMessage`; a listener in `invictus-landing.html` (search `HAPEE.AI FORM → REDIRECT`) validates the origin and redirects to `/gracias`. Conversion tracking fires on the `gracias.html` page load, NOT on form submit — this avoids losing conversions if the user closes the tab before redirect.

To change the form: replace the iframe `src` and the `data-layout-iframe-id` (must match form ID for hapee.ai's resize script).

## Tracking (already wired)

- **GTM container**: `GTM-WNTMK96Q` (head + noscript fallback in body of all 3 pages)
- **gtag.js direct**: `G-VWCD5DSP40` (GA4) and `AW-17648531850` (Google Ads) — loaded alongside GTM. There may be duplication if GTM also fires GA4/Ads tags; verify in tagmanager.google.com before adding new tracking.
- **Conversion event**: in `gracias.html` only, send_to `AW-17648531850/OcKZCPrpu50cEIrzvN9B`.
- **Placeholders**: search `META PIXEL` and `HOTJAR / CLARITY` in `invictus-landing.html` head for paste targets.

## Key Design Decisions

- **Paleta**: Negro (#0A0A0A) for hero/CTA/OS-10 sections, Blanco (#FFFFFF) and Gris (#F5F5F5) alternating for body sections, Naranja (#FA360A / #FF5E17) as accent.
- **Logo**: Uses `filter: brightness(0) invert(1)` on dark backgrounds (top bar, gracias/404), original on light backgrounds (footer).
- **Typography**: Sora (headings) + DM Sans (body) via Google Fonts, with `preconnect` to fonts.googleapis.com and fonts.gstatic.com.
- **Hero canvas effect**: "Security Grid Scanner" — animated particle grid with radar sweep and scan line, responds to mouse movement. Vanilla JS on `<canvas>`.
- **Hero LCP image**: `decorativo.png` (909 KB) is served via `<picture>` with `decorativo.webp` (55 KB) source, plus `fetchpriority="high"` and `decoding="async"`. Don't undo this when editing.
- **No external links or navigation** — Google Ads landing page best practice for Quality Score. The only `<a href>` targets are `#formulario` (anchor) and `/gracias` (post-conversion).

## SEO Configuration

- `noindex, nofollow` is intentional — this is a paid-traffic LP, not an organic page. Don't change to `index, follow` unless the project goal changes.
- Canonical: `https://seguridad.invictussecurity.cl/`. OG/Twitter image URLs must use the same host (assets at `www.invictussecurity.cl/assets/img/...` 301-redirect and break social previews).
- Schema.org `SecurityService` JSON-LD includes telephone `+56957620565`, email `comercial@invictussecurity.cl`, geo (Peñaflor lat/lon), and openingHours Mon-Fri 09:00-19:00 — these are invisible to users but provide structured data for crawlers without distracting from the form.
- No sitemap.xml (intentional — would contradict noindex).
