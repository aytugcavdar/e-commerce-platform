# Base image
FROM node:18-alpine

ENV NODE_ENV=production
WORKDIR /app

# Bağımlılıkları kur
COPY package*.json ./
COPY shared-utils/package*.json ./shared-utils/
RUN npm install --omit=dev

# Kodları kopyala
COPY shared-utils ./shared-utils
COPY services/shipping-service ./services/shipping-service

WORKDIR /app/services/shipping-service

# Portu aç (API endpoint'leri varsa)
EXPOSE 5006

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${SHIPPING_SERVICE_PORT:-5006}/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

CMD ["node", "server.js"]