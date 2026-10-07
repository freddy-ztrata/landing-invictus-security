# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lead-generation site for **Invictus Security**, a private security company in Chile (guards for condominiums, companies, events). Main traffic: **Google Ads** (Search + PMax). Goal: **qualified quote requests** — the campaigns are for clients who will hire, so the site actively filters out **curiosos** ("solo estoy averiguando") and **job seekers** (people looking for work as guards; WhatsApp was removed because only they used it).

Production: `https://invictussecurity.cl/` (canonical, indexable). `www.` and the old `seguridad.` subdomain 301 to it. Repo is **public** → never commit secrets.

## Stack

- **Astro 7**, static output, `trailingSlash: 'always'` + `build.format: 'directory'` (URLs like `/seguridad-para-condominios/`). `compressHTML: true` on purpose (the v7 default `'jsx'` eats spaces in Spanish copy).
- **MPA on purpose — no `<ClientRouter/>`**: every navigation is a real load so GTM page_view stays correct. Page transitions use native cross-document View Transitions (`@view-transition` in `src/styles/base.css`).
- Vanilla CSS (`@layer`, nesting, tokens in `src/styles/tokens.css`), vanilla TS islands in `src/scripts/`. No framework, no GSAP/Three.js (hero effect is a ~4 KB WebGL2 shader).
- Fonts self-hosted via `@fontsource-variable` (Unbounded display, Geist text, Geist Mono HUD/numbers).
- Images: AI-generated (Higgsfield) photos in `src/assets/img/gen/*.jpg`, processed by `astro:assets` (AVIF/WebP srcset). They are atmospheric only — never present them as the client's real staff.

## Commands

```bash
npm run build        # astro build + gzip precompression (scripts/precompress.mjs)
npm run preview      # serves dist/ like nginx (301 /foo→/foo/, 404.html, mock POST /api/lead)
npm test             # Playwright E2E (needs `npm run build` first; desktop + Pixel 7)
node scripts/make-og.mjs   # regenerate public/img/og/*.jpg when hero photos change
```

CI (`.github/workflows/ci.yml`) runs the E2E suite and builds the real Docker image, starts it with a mock webhook and checks headers, redirects, dotfile blocking and `/api/lead` (405/403/200/502/429) with curl. No Docker locally — rely on CI for nginx changes.

## Structure

- `src/data/empresa.ts` — **single source of truth** for entity facts (NAP, hours, figures, testimonials, comunas). Items with `verificado: false` came from the old site and are pending written confirmation from the client; fields that are `null` (RUT, razón social, authorization number, sameAs) render only when filled.
- `src/data/segmentos.ts` — the 4 segment landings (copy, FAQs, images, schema). Each H1 matches a Google Ads ad group. Keep copy/FAQs unique per page (doorway-page risk).
- `src/data/schema.ts` — JSON-LD `@graph` builders. Business node is `LocalBusiness` + `ProfessionalService` (`SecurityService` does not exist in schema.org). No self-serving review markup.
- `src/pages/` — `/`, `[segmento]/` (guardias-de-seguridad, seguridad-para-condominios, guardias-para-eventos, seguridad-para-empresas), `cotizar/`, `nosotros/`, `guia/cuantos-guardias-necesito/` (calculator), `guia/ley-21659-seguridad-privada/`, `trabaja-con-nosotros/`, `gracias/`, `privacidad/`, `404`.
- `public/` — `robots.txt` (AI search bots explicitly allowed), `llms.txt`, favicons, OG images.
- `nginx/templates/default.conf.template` + `nginx/snippets/security-headers.conf`; multi-stage `Dockerfile` (node:24-slim build → nginx:stable-alpine serving **only** `dist/`).

## Lead flow (the core of the site)

1. **One form per page** (`src/components/LeadForm.astro`, id `cotizar`; every CTA points to `#cotizar`, or `/cotizar/` on pages without it). 3 steps: chips (segment) → comuna, cobertura, **plazo**, puestos/evento → nombre, teléfono (+56, normalized to E.164), email, **rol**, empresa. Honeypot field `website`.
2. Filters: the step-1 card **"Busco empleo como guardia"** links to `/trabaja-con-nosotros/` (hapee form 146, never a lead). `plazo = "Solo estoy averiguando"` → `calidad: 'curioso'`.
3. `src/scripts/form.ts` POSTs JSON to **`/api/lead`** → nginx proxies to the **hapee nuevo** inbound webhook (workflow 526) using the env var **`LEAD_WEBHOOK_URL`** (set in Dokploy → Environment; never in code — Dokploy writes `.env` into the build context). Default value makes nginx start and the endpoint return 502 → the form shows the fallback (retry / call / email).
4. On 200 the form stores `sessionStorage.inv_lead = {id, ts, segmento, calidad, user_data}` and goes to `/gracias/?s=…`.
5. `/gracias/` consumes the token (< 30 min; referrer fallback once per session) and pushes `generate_lead` (with `lead_quality`) to the dataLayer, loads GTM, and fires the **primary Ads conversion `AW-17648531850/OcKZCPrpu50cEIrzvN9B`** with `transaction_id` + Enhanced Conversions `user_data` — **only for `calificado`**. Curiosos are recorded but never counted in Ads. Reloads, direct visits and bots measure nothing. Never link to `/gracias/`. On non-production hostnames it only logs to the console.

hapee nuevo (MCP connector, **cliente 46**): pipeline **"Ventas web" (id 127)** — stages Nuevo 1032, Contactado 1033, Calificado 1034, Cotizado 1035, Ganado 1036, Perdido 1037, Descartado 1038. Workflow **526** branches: honeypot → tag `spam`; nombre contains `PRUEBA` → tag `prueba` (test path, no deal, no email); `curioso` → deal in Descartado; else deal in Nuevo + task "Llamar en < 1 h hábil" + email to comercial@invictussecurity.cl. Contact fields: ciudad, origen, empresa, cargo (rol), landing_page, utm_*, last_click_id(+tipo), custom `gclid`, `utm_term`, `necesidad` (summary).

## Tracking

- GTM `GTM-WNTMK96Q` loads only on hostname `invictussecurity.cl` (`src/layouts/Base.astro`). dataLayer events: `form_start`, `form_step`, `form_submit_error`, `generate_lead` (only /gracias/), `call_click`, `job_seeker_click`, `cta_click`, `calculator_complete`, `faq_open`, `web_vitals`.
- GTM still has an old secondary Ads conversion (`__awct` 3VxWCLOVo6AcEIrzvN9B, trigger "URL contains gracias") — should be paused. When GTM gets its own Ads tag on `generate_lead`, remove the inline gtag block in `src/pages/gracias/index.astro` to avoid double counting.
- Attribution (`src/scripts/attribution.ts`): first/last touch of gclid/gbraid/wbraid + utm_* in localStorage (90 days), sent with every lead → hapee → offline conversion import.

## nginx rules that matter

- Headers only at server level (maps for Cache-Control / X-Robots-Tag) — never `add_header` inside a location (it drops the security headers).
- `/_astro/*` is hashed → 1 year immutable; other images 7 days; HTML revalidates.
- Legacy redirects (old WordPress + old single-page landing) live in `map $uri $inv_legacy` and always keep `$is_args$args` (gclid).
- `set_real_ip_from` for Traefik networks so `limit_req` on `/api/lead` is per visitor, not global.
- `/api/lead` accepts only POST with `Origin` = invictussecurity.cl or staging.invictussecurity.cl.

## Content rules

- **Never publish prices** (client decision). Price questions are answered with "what determines the cost" + quote in 24 h.
- Legal content (Ley 21.659 private security — in force since 2025-11-28; Ley 21.825 extended transitional deadlines; Ley 21.561 working hours: 42 h since 2026-04-26, 40 h from 2028-04-26; Ley 21.719 data protection) must stay accurate and dated. The privacy policy and guides are drafts pending the client's legal review.
- No Carabineros/OS-10 insignia unless the client confirms authorization to use it.
