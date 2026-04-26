FROM nginx:alpine

# Kopiere Nginx-Konfiguration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Kopiere Maintenance Page
COPY maintenance.html /usr/share/nginx/html/maintenance.html

# Health Check
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
