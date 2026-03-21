# Build-Kontext muss das Projekt-Root-Verzeichnis sein,
# damit das Hintergrundbild aus frontend/public/images/ kopiert werden kann.
FROM nginx:alpine

COPY .docker/maintenance/nginx.conf /etc/nginx/conf.d/default.conf
COPY .docker/maintenance/maintenance.html /usr/share/nginx/html/index.html
COPY frontend/public/images/landing_page/background.jpg /usr/share/nginx/html/background.jpg
