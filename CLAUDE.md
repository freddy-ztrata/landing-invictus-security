# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lead-generation site for **Invictus Security**, a private security company in Chile (guards for condominiums, companies, events). Main traffic: **Google Ads** (Search + PMax). Goal: **qualified quote requests** — the campaigns are for clients who will hire, so the site actively filters out **curiosos** ("solo estoy averiguando") and **job seekers** (people looking for work as guards). Client decision: the site offers **no job/application option at all** (no link, page or form for postulantes) and **no WhatsApp** (only job seekers used it).

Production: `https://invictussecurity.cl/` (canonical, indexable). `www.` and the old `seguridad.` subdomain 301 to it. Repo is **public** → never commit secrets.

## Stack

- **Astro 7**, static output, `trailingSlash: 'always'` + `build.format: 'directory'` (URLs like `/seguridad-para-condominios/`). `compressHTML: true` on purpose (the v7 default `'jsx'` eats spaces in Spanish copy).
- **MPA on purpose — no `<ClientRouter/>`**: every navigation is a real load so GTM page_view stays correct. Page transitions use native cross-document View Transitions (`@view-transition` in `src/styles/base.css`).
- Vanilla CSS (`@layer`, nesting, tokens in `src/styles/tokens.css`), vanilla TS islands in `src/scripts/`. No framework, no WebGL/GSAP/Three.js (`gsap` and `ogl` in package.json are unused leftovers).
- Fonts self-hosted via `@fontsource-variable` (Unbounded display, Geist text, Geist Mono HUD/numbers).
- Images: AI-generated (Higgsfield) photos in `src/assets/img/gen/*.jpg`, processed by `astro:assets` (AVIF/WebP srcset). They are atmospheric only — never present them as the client's real staff (no captions like "nuestro equipo").

## Commands

```bash
npm run dev          # astro dev (GTM never loads off the production hostname; /gracias/ only logs the conversion)
npm run check        # astro check (types)
npm run build        # astro build + gzip precompression (scripts/precompress.mjs)
npm run preview      # serves dist/ like nginx on :4321 (301 /foo→/foo/, 404.html, gzip_static)
npm test             # Playwright E2E against dist/ (run `npm run build` first; projects: desktop + mobile/Pixel 7)
npx playwright test -g "calculadora" --project=desktop   # single test by title
node scripts/make-og.mjs   # regenerate public/img/og/*.jpg when hero photos change
```

- Playwright starts `scripts/serve-dist.mjs` itself with `reuseExistingServer: false` → port 4321 must be free (stop `npm run preview` first).
- Tests abort every request to `beta.hapee.ai` except tests whose title contains "embed real"; `simulateHapeeSubmit()` in `tests/site.spec.ts` fakes hapee's submit postMessage. Never submit the real form in production to test it (real lead + emails + Ads conversion).
- CI (`.github/workflows/ci.yml`) runs the E2E suite and builds the real Docker image, starts it and checks headers, redirects (gclid kept), host canonicalisation and dotfile blocking with curl. No Docker locally — rely on CI for nginx changes.

## Deployment

Push to `main` → Dokploy auto-deploys (build type Dockerfile, ~2 min; nothing to configure in Dokploy, no env vars). The `rediseno` branch is kept in sync (`git push origin main:rediseno`). Verify with curl against production after the deploy.

## Structure

- `src/data/empresa.ts` — **single source of truth** for entity facts (NAP, hours, figures, testimonials, comunas). Items with `verificado: false` came from the old site and are pending written confirmation from the client; fields that are `null` (RUT, razón social, authorization number, sameAs) render only when filled.
- `src/data/segmentos.ts` — the 4 segment landings (copy, FAQs, images, schema). Each H1 matches a Google Ads ad group. Keep copy/FAQs unique per page (doorway-page risk).
- `src/data/schema.ts` — JSON-LD `@graph` builders. Business node is `LocalBusiness` + `ProfessionalService` (`SecurityService` does not exist in schema.org). No self-serving review markup.
- `src/layouts/Base.astro` — wraps every page: meta/OG, JSON-LD `@graph` (business + website nodes always; pages add nodes via the `schema` prop), GTM hostname gate, font preloads, Speculation Rules (prefetch/prerender exclude `/gracias/`, and `/cotizar/` from prerender — keep it that way so the conversion page is never pre-rendered), header/footer/`MobileBar` (props `noindex`, `minimalHeader`, `hideMobileBar`). `Guide.astro` is the layout for `/guia/*` (breadcrumbs, FAQ schema, form).
- `src/pages/` — `/`, `[segmento]/` (guardias-de-seguridad, seguridad-para-condominios, guardias-para-eventos, seguridad-para-empresas), `cotizar/`, `nosotros/`, `guia/cuantos-guardias-necesito/` (calculator), `guia/ley-21659-seguridad-privada/`, `gracias/`, `privacidad/`, `404`.
- `public/` — `robots.txt` (AI search bots explicitly allowed), `llms.txt`, favicons, OG images.
- `src/data/hapee.ts` — hapee origin + slug of the embedded form.
- `nginx/default.conf` + `nginx/snippets/security-headers.conf`; multi-stage `Dockerfile` (node:24-slim build → nginx:stable-alpine serving **only** `dist/`). **No environment variables** — the site is 100 % static.

## Hero

`src/components/Hero.astro` has two modes (the form card always sits in the right column, so the people in the photo must not end up behind it):

- **`mode="stage"`** (home): full-bleed scene limited to the first viewport and faded out with a CSS mask. Desktop grid has three zones — headline | empty band | form — and the photo must have the people **in the horizontal centre** (`hero-guardias-centro.jpg`, two guards ≈ 42–60 % of the width). The poster is the LCP (`fetchpriority=high`; mobile gets a square centre crop via `getImage({ fit: 'cover' })`). A Higgsfield loop (`public/video/hero-guardias-v2-av1.webm` + `-v2.mp4`, first frame = poster; bump the `-vN` suffix when replacing it — `/video/*` is cached 7 days) is attached by JS only on desktop, after `load` + idle, never with reduced-motion/Save-Data/2g-3g; it pauses off-screen.
- **`mode="card"`** (segments, nosotros): photo in a framed card (`.hero__visual`) and the same photo blurred/darkened as background.

The hero video is a **cinemagraph built with ffmpeg from the Higgsfield still**, not an AI-animated video: AI image-to-video (Seedance) distorted the small faces/eyes and ignored environment motion, so the guards stay untouched (sharp) and only the scene moves — two vertically-periodic rain layers (`scroll`, `screen` blend) and a sine `displace` on the wet floor (masked to exclude the guards via a background-removal cut-out). Every motion is periodic in the 6 s loop, so it loops with no crossfade, and the video has the poster's exact geometry (1920×1086 = 2688×1520 aspect) → no jump when it fades in. Encodes: AV1 WebM CRF 37 (~1.8 MB) + H.264 MP4 CRF 26 `+faststart` (~3.4 MB), no audio.

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
- The site has no gtag of its own outside `/gracias/`; GA4 and Ads come from the GTM container. Verified in production on 2026-10-07: page_view to GA4 `G-VWCD5DSP40` **and** a second GA4 property `G-8939QHYH3V` (configured in GTM, origin unclear), plus Ads remarketing `AW-17648531850`.
- GTM still has an old secondary Ads conversion (`__awct` 3VxWCLOVo6AcEIrzvN9B, trigger "URL contains gracias") — should be paused. When GTM gets its own Ads tag on `generate_lead`, remove the inline gtag block in `src/pages/gracias/index.astro` to avoid double counting.
- Attribution (`src/scripts/attribution.ts`): first/last touch of gclid/gbraid/wbraid + utm_* in localStorage (90 days), sent with every lead → hapee → offline conversion import.

## nginx rules that matter

- Headers only at server level (maps for Cache-Control / X-Robots-Tag) — never `add_header` inside a location (it drops the security headers).
- `/_astro/*` is hashed → 1 year immutable; other images 7 days; HTML revalidates.
- Legacy redirects (old WordPress + old single-page landing) live in `map $uri $inv_legacy` and always keep `$is_args$args` (gclid).
- `set_real_ip_from` for Traefik networks (real visitor IP in logs).
- CSP: minimal enforced policy + full Report-Only allowlist; `beta.hapee.ai` must stay allowed in `frame-src`/`script-src` (form embeds).

## Gotchas

- `.astro` frontmatter can't `export const`; shared constants live in `src/data/*.ts`. Never import `src/scripts/*` (browser code touching `window`) from frontmatter — it runs at build time.
- noindex pages must be listed in **both** `NOINDEX` in `astro.config.mjs` (sitemap filter) and the `X-Robots-Tag` map in `nginx/default.conf`.
- `.lead__frame` `min-height` and the embed's `data-height` (630px, `LeadForm.astro`) reserve the iframe's final height (CLS 0) — update both if the hapee form gets longer or shorter. **Never reserve MORE than the form's real height**: the hapee embed grows the iframe to fit but never shrinks it (the form measures `documentElement.scrollHeight`, which can't go below the iframe's own height), so an oversized reserve leaves a blank band. Since 2026-10-07 the form is two columns (≈627px at every width ≥ 300px); its look & feel lives in hapee, form 147 → Estilos (Invictus tokens + "CSS personalizado"), not in this repo.
- Files mix CRLF and LF: scripted string replacements must normalise `\r\n` first (the Edit tool is fine).

## Content rules

- **Never publish prices** (client decision). Price questions are answered with "what determines the cost" + quote in 24 h.
- Legal content (Ley 21.659 private security — in force since 2025-11-28; Ley 21.825 extended transitional deadlines; Ley 21.561 working hours: 42 h since 2026-04-26, 40 h from 2028-04-26; Ley 21.719 data protection) must stay accurate and dated. The privacy policy and guides are drafts pending the client's legal review.
- No Carabineros/OS-10 insignia unless the client confirms authorization to use it.
