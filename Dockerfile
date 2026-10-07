FROM nginx:alpine
# Copiar SOLO lo que se publica. Un `COPY .` exponía .git/, .env (que Dokploy
# escribe en el contexto de build), CLAUDE.md, Dockerfile y nginx.conf.
COPY *.html robots.txt sitemap.xml /usr/share/nginx/html/
COPY assets/ /usr/share/nginx/html/assets/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
