# Base image
FROM node:18-alpine

# Set environment
ENV NODE_ENV=production

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY shared-utils/package*.json ./shared-utils/

# Install dependencies
RUN npm install --omit=dev

# Copy shared-utils
COPY shared-utils ./shared-utils

# Copy inventory service files
COPY services/inventory-service ./services/inventory-service

# Set working directory to inventory service
WORKDIR /app/services/inventory-service

# Expose port
EXPOSE 5005

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5005/api/inventory/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" ||exit 1
# Start the service
CMD ["node", "server.js"]