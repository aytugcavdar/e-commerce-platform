# Base image
FROM node:18-alpine

# Set environment
ENV NODE_ENV=production

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy shared-utils package files
COPY shared-utils/package*.json ./shared-utils/

# Copy user service package files
COPY services/user-service/package*.json ./services/user-service/

# Install all dependencies
RUN npm install --omit=dev && \
    cd shared-utils && npm install --omit=dev && \
    cd ../services/user-service && npm install --omit=dev

# Copy shared-utils source
COPY shared-utils ./shared-utils

# Copy user service source
COPY services/user-service ./services/user-service

# Set working directory to user service
WORKDIR /app/services/user-service

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start the service
CMD ["node", "server.js"]