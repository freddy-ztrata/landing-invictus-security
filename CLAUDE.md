# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lead-generation site for **Invictus Security**, a private security company in Chile (guards for condominiums, companies, events). Main traffic: **Google Ads** (Search + PMax). Goal: **qualified quote requests** — the campaigns are for clients who will hire, so the site actively filters out **curiosos** ("solo estoy averiguando") and **job seekers** (people looking for work as guards). Client decision: the site offers **no job/application option at all** (no link, page or form for postulantes) and **no WhatsApp** (only job seekers used it).

Production: `https://invictussecurity.cl/` (canonical, indexable). `www.` and the old `seguridad.` subdomain 301 to it. Repo is **public** → never commit secrets.

## Stack

- **Astro 7**, static output, `trailingSlash: 'always'` + `build.format: 'directory'` (URLs like `/seguridad-para-condominios/`). `compressHTML: true` on purpose (the v7 default `'jsx'` eats spaces in Spanish copy).
- **MPA on purpose — no `<ClientRouter/>`**: every navigation is a real load so GTM page_view stays correct. Page transitions use native cross-document View Transitions (`@view-transition` in `src/styles/base.css`).
- Vanilla CSS (`@layer`, nesting, tokens in `src/styles/tokens.css`), vanilla TS islands in `src/scripts/`. No framework, no GSAP/Three.js (hero effect is a ~4 KB WebGL2 shader).
- Fonts self-hosted via `@fontsource-variable` (Unbounded display, Geist text, Geist Mono HUD/numbers).
- Images: AI-generated (Higgsfield) photos in `src/assets/img/gen/*.jpg`, processed by `astro:assets` (AVIF/WebP srcset). They are atmospheric only — never present them as the client's real staff (no captions like "nuestro equipo").

## Commands

```bash
npm run build        # astro build + gzip precompression (scripts/precompress.mjs)
npm run preview      # serves dist/ like nginx (301 /foo→/foo/, 404.html, gzip_static)
npm test             # Playwright E2E (needs `npm run build` first; desktop + Pixel 7)
node scripts/make-og.mjs   # regenerate public/img/og/*.jpg when hero photos change
```

CI (`.github/workflows/ci.yml`) runs the E2E suite and builds the real Docker image, starts it and checks headers, redirects (gclid kept), host canonicalisation and dotfile blocking with curl. No Docker locally — rely on CI for nginx changes.

## Structure

- `src/data/empresa.ts` — **single source of truth** for entity facts (NAP, hours, figures, testimonials, comunas). Items with `verificado: false` came from the old site and are pending written confirmation from the client; fields that are `null` (RUT, razón social, authorization number, sameAs) render only when filled.
- `src/data/segmentos.ts` — the 4 segment landings (copy, FAQs, images, schema). Each H1 matches a Google Ads ad group. Keep copy/FAQs unique per page (doorway-page risk).
- `src/data/schema.ts` — JSON-LD `@graph` builders. Business node is `LocalBusiness` + `ProfessionalService` (`SecurityService` does not exist in schema.org). No self-serving review markup.
- `src/pages/` — `/`, `[segmento]/` (guardias-de-seguridad, seguridad-para-condominios, guardias-para-eventos, seguridad-para-empresas), `cotizar/`, `nosotros/`, `guia/cuantos-guardias-necesito/` (calculator), `guia/ley-21659-seguridad-privada/`, `gracias/`, `privacidad/`, `404`.
- `public/` — `robots.txt` (AI search bots explicitly allowed), `llms.txt`, favicons, OG images.
- `src/data/hapee.ts` — slugs of the embedded hapee forms.
- `nginx/default.conf` + `nginx/snippets/security-headers.conf`; multi-stage `Dockerfile` (node:24-slim build → nginx:stable-alpine serving **only** `dist/`). **No environment variables** — the site is 100 % static.

## Hero

`src/components/Hero.astro`: dark "Centro de Mando" background (WebGL scanner + grid/glow) and the guards photo in a framed card (`.hero__visual`, LCP image with `fetchpriority=high`). It is NOT a full-bleed background because the form card covers the right column. Desktop: title + photo + bullets left, form right. Mobile: photo full-width on top → title → form → bullets. Home uses `hero-guardias-equipo.jpg` (guards on the right, `imagePosition` ≈ 78%).

## Lead flow (the core of the site)

**All forms are hapee nuevo embeds (iframe) — client decision: no webhook, no own API.** Fields, notifications and pipeline are edited in hapee, not in this repo.

1. **One quote form per page** (`src/components/LeadForm.astro`, id `cotizar`; every CTA points to `#cotizar`, or `/cotizar/` on pages without it). It embeds hapee form **147 "Cotización web (invictussecurity.cl)"** (`data-zentru-form="invictus_security/cotizaci-n-web-invictussecurity-cl"` + `https://beta.hapee.ai/static/form-embed.js`). Fields: segmento, comuna, **plazo** (incl. "Solo estoy averiguando"), cobertura, nombre, teléfono, email, **rol**, empresa, mensaje. On submit hapee creates the contact (with gclid/UTM it reads from the page URL) and a deal in pipeline **"Ventas web" (127)**, stage Nuevo (1032). Email notification (set in the hapee UI — the connector can't edit it): subject **"Formulario Landing Seguridad"**, to **comercial@invictussecurity.cl, freddy@digitals.cl, marketing@digitals.cl**, sender name **"Invictus Security"**, no reply-to, no PDF.
2. No job-seeker option anywhere (removed on request; job intent is handled with Ads negatives). Curiosos are identified in hapee by the `plazo` field (they still count as an Ads conversion: the iframe is cross-origin, the site can't read answers — use offline conversion import of qualified deals to correct bidding).
3. Attribution: hapee only reads gclid/gbraid/wbraid/utm from the URL of the page holding the form, so an inline script in `LeadForm.astro` re-adds the last stored touch (`src/scripts/attribution.ts`, localStorage, 90 days) to the URL via `history.replaceState` before the embed loads.
4. `src/scripts/form.ts` listens for hapee's `zentru_form_submitted` postMessage (origin `https://beta.hapee.ai`, matching form slug), stores `sessionStorage.inv_lead = {id: "lead.<hapee submission>", ts, segmento}` and navigates to `/gracias/?s=…` after 700 ms. It also sets a `title` on the iframe (a11y).
5. `/gracias/` consumes the token (< 30 min; referrer fallback once per session), pushes `generate_lead` to the dataLayer, loads GTM and fires the **primary Ads conversion `AW-17648531850/OcKZCPrpu50cEIrzvN9B`** with `transaction_id` = hapee submission id. Reloads, direct visits and bots measure nothing. Never link to `/gracias/`. On non-production hostnames it only logs to the console.

hapee nuevo (MCP connector, **cliente 46**): pipeline **"Ventas web" (id 127)** — stages Nuevo 1032, Contactado 1033, Calificado 1034, Cotizado 1035, Ganado 1036, Perdido 1037, Descartado 1038. Workflow 526 (old inbound-webhook design) is unpublished and unused.

## Tracking

- GTM `GTM-WNTMK96Q` loads only on hostname `invictussecurity.cl` (`src/layouts/Base.astro`). dataLayer events: `form_start` (focus enters the hapee iframe), `form_submit`, `generate_lead` (only /gracias/), `call_click`, `cta_click`, `calculator_complete`, `faq_open`, `web_vitals`.
- GTM still has an old secondary Ads conversion (`__awct` 3VxWCLOVo6AcEIrzvN9B, trigger "URL contains gracias") — should be paused. When GTM gets its own Ads tag on `generate_lead`, remove the inline gtag block in `src/pages/gracias/index.astro` to avoid double counting.
- Attribution (`src/scripts/attribution.ts`): first/last touch of gclid/gbraid/wbraid + utm_* in localStorage (90 days), sent with every lead → hapee → offline conversion import.

## nginx rules that matter

- Headers only at server level (maps for Cache-Control / X-Robots-Tag) — never `add_header` inside a location (it drops the security headers).
- `/_astro/*` is hashed → 1 year immutable; other images 7 days; HTML revalidates.
- Legacy redirects (old WordPress + old single-page landing) live in `map $uri $inv_legacy` and always keep `$is_args$args` (gclid).
- `set_real_ip_from` for Traefik networks (real visitor IP in logs).
- CSP: minimal enforced policy + full Report-Only allowlist; `beta.hapee.ai` must stay allowed in `frame-src`/`script-src` (form embeds).

## Content rules

- **Never publish prices** (client decision). Price questions are answered with "what determines the cost" + quote in 24 h.
- Legal content (Ley 21.659 private security — in force since 2025-11-28; Ley 21.825 extended transitional deadlines; Ley 21.561 working hours: 42 h since 2026-04-26, 40 h from 2028-04-26; Ley 21.719 data protection) must stay accurate and dated. The privacy policy and guides are drafts pending the client's legal review.
- No Carabineros/OS-10 insignia unless the client confirms authorization to use it.
