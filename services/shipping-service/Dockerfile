# Base image
FROM node:18-alpine

# Set environment
ENV NODE_ENV=production

WORKDIR /app

# Copy root package.json
COPY package*.json ./

# Copy shared-utils
COPY shared-utils ./shared-utils

# Install root dependencies
RUN npm install --omit=dev

# Copy shipping service
COPY services/shipping-service ./services/shipping-service

# Install shipping service dependencies
WORKDIR /app/services/shipping-service
RUN npm install --omit=dev

# Expose port
EXPOSE 5006

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${SHIPPING_SERVICE_PORT:-5006}/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start the service
CMD ["node", "server.js"]