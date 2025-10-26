# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY shared-utils/package*.json ./shared-utils/

# Install dependencies
RUN npm install --production

# Copy shared-utils
COPY shared-utils ./shared-utils

# Copy product service files
COPY services/product-service ./services/product-service

# Set working directory to product service
WORKDIR /app/services/product-service

# Expose port
EXPOSE 5002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5002/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the service
CMD ["node", "server.js"]