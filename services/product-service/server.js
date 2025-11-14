require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const {
  logger,
  middleware,
  helpers,
  rabbitmq, // ✅ RabbitMQ ekle
} = require('@ecommerce/shared-utils');

const { ErrorHandler } = middleware;
const { CloudinaryHelper } = helpers;

// ============================================
// ROUTES - Import all routes
// ============================================
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const brandRoutes = require('./routes/brandRoutes');

const app = express();

console.log('🔍 Environment Check:');
console.log('RABBITMQ_URI:', process.env.RABBITMQ_URI || 'NOT SET');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV);


// Initialize Cloudinary
CloudinaryHelper.init();

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// HEALTH CHECK (✅ RabbitMQ durumu eklendi)
// ============================================
app.get('/health', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  
  // RabbitMQ bağlantı kontrolü
  let rabbitMqConnected = false;
  try {
    const conn = await rabbitmq.connection.connect();
    rabbitMqConnected = !!conn;
  } catch (e) {
    rabbitMqConnected = false;
  }

  const isHealthy = dbState === 1 && rabbitMqConnected;

  res.status(isHealthy ? 200 : 503).json({
    success: true,
    message: 'Product Service is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    dbConnection: mongoose.STATES[dbState],
    rabbitMqConnection: rabbitMqConnected ? 'connected' : 'disconnected',
    routes: {
      brands: '/brands',
      categories: '/categories',
      products: '/'
    }
  });
});

// ============================================
// ROUTES - Order matters!
// ============================================

// 1️⃣ Brands - Most specific first
app.use('/brands', brandRoutes);
logger.info('📌 Brand routes registered at: /brands');

// 2️⃣ Categories - Second specific
app.use('/categories', categoryRoutes);
logger.info('📌 Category routes registered at: /categories');

// 3️⃣ Products - General route last
app.use('/', productRoutes);
logger.info('📌 Product routes registered at: /');

// ============================================
// ERROR HANDLING
// ============================================
app.use(ErrorHandler.notFound);
app.use(ErrorHandler.handle);

const PORT = process.env.PORT || 5002;

// ============================================
// START SERVER (✅ RabbitMQ bağlantısı eklendi)
// ============================================
const startServer = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('✅ MongoDB connection successful (Product Service)');

    // ✅ Connect to RabbitMQ
    try {
      await rabbitmq.connection.connect();
      logger.info('✅ RabbitMQ connection successful (Product Service)');
    } catch (rabbitError) {
      logger.warn('⚠️  RabbitMQ connection failed, events will not be published:', rabbitError.message);
      // Service can still work without RabbitMQ (events won't be published)
    }

    // Start listening
    app.listen(PORT, () => {
      logger.info(`🚀 Product Service is running on port ${PORT}`);
      logger.info(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📍 Routes:`);
      logger.info(`   - GET /health`);
      logger.info(`   - /brands/* (Brand routes)`);
      logger.info(`   - /categories/* (Category routes)`);
      logger.info(`   - /* (Product routes)`);
    });
  } catch (error) {
    logger.error('❌ Failed to start Product Service:', error);
    process.exit(1);
  }
};

// ============================================
// GRACEFUL SHUTDOWN (✅ RabbitMQ close eklendi)
// ============================================
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing Product Service gracefully');
  
  // Close RabbitMQ connection
  try {
    await rabbitmq.connection.close();
    logger.info('RabbitMQ connection closed');
  } catch (err) {
    logger.error('Error closing RabbitMQ:', err);
  }
  
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing Product Service gracefully');
  
  // Close RabbitMQ connection
  try {
    await rabbitmq.connection.close();
    logger.info('RabbitMQ connection closed');
  } catch (err) {
    logger.error('Error closing RabbitMQ:', err);
  }
  
  await mongoose.connection.close();
  process.exit(0);
});

startServer();