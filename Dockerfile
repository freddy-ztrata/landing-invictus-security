# ── 1) Build: Astro genera HTML estático + assets con hash en dist/ ─────────────
FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY astro.config.mjs tsconfig.json ./
COPY scripts ./scripts
COPY public ./public
COPY src ./src
RUN npm run build

# ── 2) Runtime: nginx sirve SOLO dist/ (nunca el repo: ni .git ni .env) ─────────
FROM nginx:stable-alpine
# envsubst del template SOLO para variables LEAD_*; valor por defecto para que nginx
# siempre arranque. El valor real de LEAD_WEBHOOK_URL se configura en Dokploy (Environment).
ENV NGINX_ENVSUBST_FILTER=^LEAD_ \
    LEAD_WEBHOOK_URL=http://127.0.0.1:9/unset
COPY nginx/templates/ /etc/nginx/templates/
COPY nginx/snippets/ /etc/nginx/snippets/
COPY --from=build /app/dist/ /usr/share/nginx/html/
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
