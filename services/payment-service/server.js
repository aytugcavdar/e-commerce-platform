require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { logger, middleware, rabbitmq, constants } = require('@ecommerce/shared-utils'); // shared-utils'dan
const { startConsumers } = require('./consumers/paymentConsumer'); // Consumer'ları başlatma fonksiyonu

// Gerekli middleware'ler (şu an için temel olanlar yeterli)
const { ErrorHandler } = middleware; // shared-utils'dan

const app = express();

// --- Temel Middleware'ler ---
// Bu servise dışarıdan doğrudan istek gelmeyecekse CORS/Helmet/RateLimit gerekmeyebilir.
// Ancak webhook gibi endpointler eklenirse GEREKLİ OLUR. Şimdilik eklemeyelim.
// app.use(middleware.securityMiddleware.helmetMiddleware());
// app.use(middleware.securityMiddleware.corsMiddleware());
app.use(express.json()); // Gelen JSON body'lerini parse etmek için

// --- Request Logger ---
app.use((req, res, next) => {
  // Bu servise normalde HTTP isteği gelmemeli (sadece RabbitMQ), ama gelirse loglayalım.
  logger.info(`[PaymentSvc] REQ: ${req.method} ${req.originalUrl}`);
  res.on('finish', () => { logger.info(`[PaymentSvc] RES: ${req.method} ${req.originalUrl} -> ${res.statusCode}`); });
  next();
});

// --- ROTALAR ---
// Sağlık kontrolü (Gateway veya monitoring araçları için)
app.get('/health', async (req, res) => { // async yapalım
  const dbState = mongoose.connection.readyState;
  let rabbitMqConnected = false;
  try {
    const conn = await rabbitmq.connection.connect(); // Bağlantıyı almayı dene
    rabbitMqConnected = !!conn;
  } catch (e) {
    rabbitMqConnected = false;
  }
  const isHealthy = dbState === 1 && rabbitMqConnected; // DB ve RabbitMQ bağlıysa sağlıklı
  res.status(isHealthy ? constants.httpStatus.OK : constants.httpStatus.SERVICE_UNAVAILABLE).json({ // shared-utils sabitleri
    status: isHealthy ? 'healthy' : 'unhealthy',
    service: 'Payment Service',
    dbConnection: mongoose.STATES[dbState],
    rabbitMqConnection: rabbitMqConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Gerekirse diğer API rotaları buraya eklenebilir (örn: admin paneli için ödeme listeleme)
// const paymentRoutes = require('./routes/paymentRoutes');
// app.use('/api/payments', paymentRoutes);

// --- Hata Yönetimi ---
// app.use(middleware.securityMiddleware.handleCorsError); // Eğer CORS kullanılıyorsa
app.use(ErrorHandler.notFound); // Bulunamayan rotalar için
app.use(ErrorHandler.handle); // Genel hata yakalayıcı

// --- Sunucu Başlatma ---
const PORT = process.env.PAYMENT_SERVICE_PORT || 5004; // .env'den portu al
const DB_URI = process.env.MONGODB_URI_PAYMENT; // .env'den DB URI'ını al

if (!DB_URI || !process.env.RABBITMQ_URI) { // RabbitMQ URI kontrolü
  logger.error('❌ Missing required environment variables (MONGODB_URI_PAYMENT, RABBITMQ_URI). Exiting.');
  process.exit(1);
}

let server; // Graceful shutdown için

const startServer = async () => {
  try {
    // MongoDB'ye bağlan
    logger.info('[PaymentSvc] Connecting to MongoDB...');
    await mongoose.connect(DB_URI);
    logger.info('✅ [PaymentSvc] MongoDB connection successful.');

    // RabbitMQ Consumer'larını başlat (Bu aynı zamanda RabbitMQ bağlantısını da kurar)
    await startConsumers(); // Consumer'ları başlat

    // Sunucuyu dinlemeye başla (Eğer HTTP endpoint'leri varsa)
    server = app.listen(PORT, () => {
      // Payment service'in HTTP portunu dinlemesi gerekmeyebilir,
      // sadece consumer olarak çalışacaksa bu kısım kaldırılabilir.
      // Ancak health check için genellikle açık bırakılır.
      logger.info(`🚀 [PaymentSvc] HTTP Server running on port ${PORT} (primarily for health checks)`);
    });

  } catch (error) {
    logger.error('❌ Failed to start Payment Service:', error);
    process.exit(1);
  }
};

// --- Graceful Shutdown ---
// Diğer servislerdeki gibi (inventory-service örneği)
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach(sig => {
  process.on(sig, async () => {
    logger.warn(`[PaymentSvc] Received ${sig}, starting graceful shutdown...`);
    // 1. HTTP sunucusunu kapat (varsa)
    if (server) {
      server.close(async () => {
        logger.info('[PaymentSvc] HTTP server closed.');
        await shutdownDependencies(); // Diğer adımları burada çağır
      });
    } else {
      await shutdownDependencies(); // HTTP sunucusu yoksa direkt diğer adımlara geç
    }
    // Timeout
    setTimeout(() => { logger.error('[PaymentSvc] Force shutdown due to timeout.'); process.exit(1); }, 15000);
  });
});

async function shutdownDependencies() {
    // 2. RabbitMQ Consumer'larını ve bağlantısını kapat
    logger.info('[PaymentSvc] Closing RabbitMQ connections...');
    try {
        await rabbitmq.consumer.stopAll(); // shared-utils'daki helper
        await rabbitmq.connection.close(); // shared-utils'daki helper
        logger.info('[PaymentSvc] RabbitMQ connections closed.');
    } catch (mqCloseError) { logger.error('[PaymentSvc] Error closing RabbitMQ:', mqCloseError); }
    // 3. Veritabanı bağlantısını kapat
    logger.info('[PaymentSvc] Closing MongoDB connection...');
    try { await mongoose.connection.close(); logger.info('[PaymentSvc] MongoDB connection closed.'); } catch (dbCloseError) { logger.error('[PaymentSvc] Error closing MongoDB:', dbCloseError); }
    // 4. Çıkış yap
    logger.info('[PaymentSvc] Shutdown complete.');
    process.exit(0);
}


startServer();