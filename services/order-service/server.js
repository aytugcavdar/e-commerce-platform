require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const {
  logger,
  middleware,
  helpers,
} = require('@ecommerce/shared-utils');

const { ErrorHandler } = middleware;
const orderRoutes = require('./routes/orderRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isHealthy = dbState === 1;
  res.status(isHealthy ? 200 : 503).json({
    success: true,
    message: 'Order Service is healthy',
    dbConnection: mongoose.STATES[dbState],
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
app.use('/', orderRoutes);

// Error handling
app.use(ErrorHandler.notFound);
app.use(ErrorHandler.handle);

const PORT = process.env.ORDER_SERVICE_PORT || 5003;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI_ORDER);
    logger.info('✅ MongoDB connection successful (Order Service)');

    // Start listening
    app.listen(PORT, () => {
      logger.info(`🚀 Order Service is running on port ${PORT}`);
      logger.info(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start Order Service:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing Order Service gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing Order Service gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

startServer();