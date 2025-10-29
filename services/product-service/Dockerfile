# Base image
FROM node:18-alpine

# Set environment
ENV NODE_ENV=production

WORKDIR /app

# Copy root package.json
COPY package*.json ./

# Copy shared-utils
COPY shared-utils ./shared-utils

# Install shared-utils dependencies first
WORKDIR /app/shared-utils
RUN npm install --omit=dev

# Go back to root and install root dependencies
WORKDIR /app
RUN npm install --omit=dev

# Copy product service
COPY services/product-service ./services/product-service

# Install product service dependencies
WORKDIR /app/services/product-service
RUN npm install --omit=dev

# Expose port
EXPOSE 5002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5002/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start the service
CMD ["node", "server.js"]