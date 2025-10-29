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

# Copy notification service
COPY services/notification-service ./services/notification-service

# Install notification service dependencies
WORKDIR /app/services/notification-service
RUN npm install --omit=dev

# No port exposure needed (only RabbitMQ consumer)

# Health check (checks if the process is running)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD pgrep -f "node.*server.js" > /dev/null || exit 1

# Start the service
CMD ["node", "server.js"]