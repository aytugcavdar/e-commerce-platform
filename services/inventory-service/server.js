// services/inventory-service/server.js

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { logger, middleware, rabbitmq, constants } = require('@ecommerce/shared-utils');
const inventoryRoutes = require('./routes/inventoryRoutes');
const { startConsumers } = require('./consumer'); // Consumer başlatma fonksiyonu

// Gerekli middleware'ler
const { ErrorHandler, securityMiddleware, rateLimitMiddleware } = middleware;

const app = express();

// --- Temel Middleware'ler ---
app.use(securityMiddleware.helmetMiddleware());
// CORS: Servisler arası iletişim genellikle gateway üzerinden olur ama doğrudan
// iletişim olursa diye veya admin paneli doğrudan buraya bağlanırsa diye eklenebilir.
// Gateway üzerinden olacaksa daha kısıtlı bir CORS ayarı yapılabilir.
app.use(securityMiddleware.corsMiddleware());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// --- Rate Limiting ---
app.use(rateLimitMiddleware.generalLimiter);

// --- Request Logger ---
app.use((req, res, next) => {
  logger.info(`[InventorySvc] REQ: ${req.method} ${req.originalUrl}`);
  res.on('finish', () => { logger.info(`[InventorySvc] RES: ${req.method} ${req.originalUrl} -> ${res.statusCode}`); });
  next();
});

// --- ROTALAR ---
// Sağlık kontrolü
app.get('/api/inventory/health', async (req, res) => { // async yapalım
  const dbState = mongoose.connection.readyState;
  let rabbitMqConnected = false;
  try {
      // RabbitMQ bağlantısını kontrol et (connection helper'ında bir isConnected metodu varsa)
      const conn = await rabbitmq.connection.connect(); // Bağlantıyı almayı dene
      rabbitMqConnected = !!conn; // Bağlantı varsa true
  } catch (e) {
      rabbitMqConnected = false;
  }
  const isHealthy = dbState === 1 && rabbitMqConnected;
  res.status(isHealthy ? constants.httpStatus.OK : constants.httpStatus.SERVICE_UNAVAILABLE).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    service: 'Inventory Service',
    dbConnection: mongoose.STATES[dbState],
    rabbitMqConnection: rabbitMqConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Ana inventory rotalarını bağla
app.use('/api/inventory', inventoryRoutes);

// --- Hata Yönetimi ---
app.use(securityMiddleware.handleCorsError);
app.use(ErrorHandler.notFound);
app.use(ErrorHandler.handle);

// --- Sunucu Başlatma ---
const PORT = process.env.INVENTORY_SERVICE_PORT || 5005; // Port .env'den
const DB_URI = process.env.MONGODB_URI_INVENTORY; // DB URI .env'den

if (!DB_URI || !process.env.RABBITMQ_URI) { // RabbitMQ URI'si de olmalı
  logger.error('❌ Missing required environment variables (MONGODB_URI_INVENTORY, RABBITMQ_URI). Exiting.');
  process.exit(1);
}

let server; // Graceful shutdown için

const startServer = async () => {
  try {
    // MongoDB'ye bağlan
    logger.info('[InventorySvc] Connecting to MongoDB...');
    await mongoose.connect(DB_URI);
    logger.info('✅ [InventorySvc] MongoDB connection successful.');

    // RabbitMQ Consumer'larını başlat (Bu aynı zamanda RabbitMQ bağlantısını da kurar)
    await startConsumers(); // Bu fonksiyon içinde bağlantı ve consumer başlangıcı var

    // Sunucuyu dinlemeye başla
    server = app.listen(PORT, () => {
      logger.info(`🚀 [InventorySvc] HTTP Server running on port ${PORT}`);
    });

  } catch (error) {
    logger.error('❌ Failed to start Inventory Service:', error);
    process.exit(1);
  }
};

// --- Graceful Shutdown ---
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach(sig => {
  process.on(sig, async () => {
    logger.warn(`[InventorySvc] Received ${sig}, starting graceful shutdown...`);
    // 1. HTTP sunucusunu kapat (yeni istekleri reddet)
    server.close(async () => {
      logger.info('[InventorySvc] HTTP server closed.');
      // 2. RabbitMQ Consumer'larını ve bağlantısını kapat
      logger.info('[InventorySvc] Closing RabbitMQ connections...');
      try {
          await rabbitmq.consumer.stopAll();
          await rabbitmq.connection.close();
          logger.info('[InventorySvc] RabbitMQ connections closed.');
      } catch (mqCloseError) { logger.error('[InventorySvc] Error closing RabbitMQ:', mqCloseError); }
      // 3. Veritabanı bağlantısını kapat
      logger.info('[InventorySvc] Closing MongoDB connection...');
      try { await mongoose.connection.close(); logger.info('[InventorySvc] MongoDB connection closed.'); } catch (dbCloseError) { logger.error('[InventorySvc] Error closing MongoDB:', dbCloseError); }
      // 4. Çıkış yap
      logger.info('[InventorySvc] Shutdown complete.');
      process.exit(0);
    });
    // Timeout
    setTimeout(() => { logger.error('[InventorySvc] Force shutdown due to timeout.'); process.exit(1); }, 15000);
  });
});

startServer();