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

# Copy gateway files
COPY gateway ./gateway

# Set working directory to gateway
WORKDIR /app/gateway

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start the gateway
CMD ["node", "server.js"]