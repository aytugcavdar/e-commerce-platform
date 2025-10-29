require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { logger, middleware, rabbitmq, constants } = require('@ecommerce/shared-utils');
const { startConsumers } = require('./consumers/shippingConsumer');
const shippingRoutes = require('./routes/shippingRoutes');

const { ErrorHandler, securityMiddleware, rateLimitMiddleware } = middleware;

const app = express();

// Basic Middleware
app.use(securityMiddleware.helmetMiddleware());
app.use(securityMiddleware.corsMiddleware());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Rate Limiting
app.use(rateLimitMiddleware.generalLimiter);

// Request Logger
app.use((req, res, next) => {
  logger.info(`[ShippingSvc] REQ: ${req.method} ${req.originalUrl}`);
  res.on('finish', () => { 
    logger.info(`[ShippingSvc] RES: ${req.method} ${req.originalUrl} -> ${res.statusCode}`); 
  });
  next();
});

// Health Check
app.get('/health', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  let rabbitMqConnected = false;
  try {
    const conn = await rabbitmq.connection.connect();
    rabbitMqConnected = !!conn;
  } catch (e) {
    rabbitMqConnected = false;
  }
  const isHealthy = dbState === 1 && rabbitMqConnected;
  res.status(isHealthy ? constants.httpStatus.OK : constants.httpStatus.SERVICE_UNAVAILABLE).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    service: 'Shipping Service',
    dbConnection: mongoose.STATES[dbState],
    rabbitMqConnection: rabbitMqConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/shipping', shippingRoutes);

// Error Handling
app.use(securityMiddleware.handleCorsError);
app.use(ErrorHandler.notFound);
app.use(ErrorHandler.handle);

const PORT = process.env.SHIPPING_SERVICE_PORT || 5006;
const DB_URI = process.env.MONGODB_URI_SHIPPING;

if (!DB_URI || !process.env.RABBITMQ_URI) {
  logger.error('❌ Missing required environment variables (MONGODB_URI_SHIPPING, RABBITMQ_URI). Exiting.');
  process.exit(1);
}

let server;

const startServer = async () => {
  try {
    // Connect to MongoDB
    logger.info('[ShippingSvc] Connecting to MongoDB...');
    await mongoose.connect(DB_URI);
    logger.info('✅ [ShippingSvc] MongoDB connection successful.');

    // Start RabbitMQ Consumers
    await startConsumers();

    // Start HTTP Server
    server = app.listen(PORT, () => {
      logger.info(`🚀 [ShippingSvc] HTTP Server running on port ${PORT}`);
    });

  } catch (error) {
    logger.error('❌ Failed to start Shipping Service:', error);
    process.exit(1);
  }
};

// Graceful Shutdown
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach(sig => {
  process.on(sig, async () => {
    logger.warn(`[ShippingSvc] Received ${sig}, starting graceful shutdown...`);
    
    if (server) {
      server.close(async () => {
        logger.info('[ShippingSvc] HTTP server closed.');
        await shutdownDependencies();
      });
    } else {
      await shutdownDependencies();
    }
    
    setTimeout(() => { 
      logger.error('[ShippingSvc] Force shutdown due to timeout.'); 
      process.exit(1); 
    }, 15000);
  });
});

async function shutdownDependencies() {
  logger.info('[ShippingSvc] Closing RabbitMQ connections...');
  try {
    await rabbitmq.consumer.stopAll();
    await rabbitmq.connection.close();
    logger.info('[ShippingSvc] RabbitMQ connections closed.');
  } catch (mqCloseError) { 
    logger.error('[ShippingSvc] Error closing RabbitMQ:', mqCloseError); 
  }
  
  logger.info('[ShippingSvc] Closing MongoDB connection...');
  try { 
    await mongoose.connection.close(); 
    logger.info('[ShippingSvc] MongoDB connection closed.'); 
  } catch (dbCloseError) { 
    logger.error('[ShippingSvc] Error closing MongoDB:', dbCloseError); 
  }
  
  logger.info('[ShippingSvc] Shutdown complete.');
  process.exit(0);
}

startServer();