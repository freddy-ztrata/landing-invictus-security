# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Google Ads landing page for **Invictus Security**, a private security company in Chile (guardias de seguridad privada, OS-10 certified). Single-file static HTML site deployed via Docker/Nginx on Dokploy.

## Architecture

- **`invictus-landing.html`** — The entire landing page: HTML + CSS (`<style>`) + vanilla JS (`<script>`). No frameworks, no build step.
- **`assets/img/`** — Images downloaded from invictussecurity.cl (logos, service photos, favicon). Referenced via relative paths.
- **`Dockerfile` + `nginx.conf`** — Production deployment via nginx:alpine. Serves `invictus-landing.html` as index.
- **`.agents/skills/`** — Installed Claude Code skills (copywriting, seo-audit, ui-ux-pro-max, web-design-guidelines, remotion-best-practices). Not committed to git.

## Development

```bash
# Local dev server
npx serve . -l 3000
# Then open http://localhost:3000/invictus-landing.html

# Docker build (matches Dokploy deployment)
docker build -t invictus-landing .
docker run -p 8080:80 invictus-landing
```

## Deployment

Hosted on Dokploy via GitHub auto-deploy. Build type: **Dockerfile** (not Nixpacks). Every push to `main` triggers a new deployment.

```bash
# Push changes to deploy
git add <files> && git commit -m "message" && git push
```

## Key Design Decisions

- **Paleta**: Negro (#0A0A0A) for hero/CTA/OS-10 sections, Blanco (#FFFFFF) and Gris (#F5F5F5) alternating for body sections, Naranja (#FA360A / #FF5E17) as accent. Mirrors invictussecurity.cl but with more contrast.
- **Logo**: Uses `filter: brightness(0) invert(1)` on dark backgrounds (top bar), original black on light backgrounds (footer).
- **Typography**: Sora (headings) + DM Sans (body) via Google Fonts.
- **Hero canvas effect**: "Security Grid Scanner" — animated particle grid with radar sweep and scan line, responds to mouse movement. Implemented in vanilla JS on `<canvas>`.
- **Form**: Placeholder HTML form — will be replaced by GoHighLevel (GHL) iframe. Search for `PEGAR_URL_AQUI` and `PEGAR_EMAIL_AQUI` for webhook/email config, or replace the entire `<form>` with a GHL embed.
- **No external links or navigation** — Google Ads landing page best practice for Quality Score.

## SEO Configuration

- Primary keyword: "empresa de seguridad privada en Chile"
- 24 secondary keywords integrated throughout headings, body text, and alt attributes
- Schema.org `SecurityService` JSON-LD in `<head>`
- `noindex, nofollow` — change to `index, follow` if organic traffic is desired
- Canonical URL set to `https://www.invictussecurity.cl/` — update if hosted elsewhere

## Tracking Placeholders

Search the HTML for these comment markers to add tracking scripts:
- `GOOGLE TAG (gtag.js)` — Google Analytics / Google Tag
- `GOOGLE ADS CONVERSION` — Conversion event in form submit handler
- `META PIXEL` — Facebook/Meta pixel
- `HOTJAR / CLARITY` — Heatmap tools
