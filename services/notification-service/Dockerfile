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

# Copy notification service files
COPY services/notification-service ./services/notification-service

# Set working directory to notification service
WORKDIR /app/services/notification-service

# No port exposure needed (only RabbitMQ consumer)
# Optionally expose a health check port if needed
# EXPOSE 5007

# Health check (optional - checks if the process is running)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD pgrep -f "node.*server.js" > /dev/null || exit 1

# Start the service
CMD ["node", "server.js"]