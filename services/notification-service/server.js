require('dotenv').config();
const { logger, rabbitmq, helpers } = require('@ecommerce/shared-utils'); //
const { startConsumers } = require('./consumers/notificationConsumer');
const { EmailHelper } = helpers; //

let rabbitMqConnected = false;

const startServer = async () => {
  try {
    logger.info('[NotificationSvc] Starting service...');

    // 1. E-posta servisini yapılandır ve test et
    await EmailHelper.configure(); // shared-utils'dan
    if (!EmailHelper.isConfigured) {
        throw new Error('Email service could not be configured or verified.');
    }

    // 2. RabbitMQ bağlantısını kur (Consumer'lar başlamadan önce bir kez deneyelim)
    try {
        await rabbitmq.connection.connect(); //
        rabbitMqConnected = true;
        logger.info('✅ [NotificationSvc] RabbitMQ connection successful.');
    } catch (rabbitError) {
        logger.error('❌ [NotificationSvc] Initial RabbitMQ connection failed. Consumers might fail to start.', rabbitError);
        // Hata fırlatıp servisi durdurabilir veya consumer'ların kendi içinde hata vermesini bekleyebiliriz.
        // Şimdilik devam edelim, consumer'lar kendi bağlantı denemelerini yapacak.
    }


    // 3. RabbitMQ Consumer'larını başlat
    await startConsumers(); // Bu fonksiyon içinde de bağlantı denenir

    logger.info('🚀 [NotificationSvc] Service started and consumers are listening.');

    // Bu servisin bir HTTP portu dinlemesine GEREK YOK.
    // Sadece RabbitMQ mesajlarını işleyecek.
    // Eğer ileride bir health check endpoint'i eklemek istersen,
    // o zaman minimal bir Express server kurabilirsin.

  } catch (error) {
    logger.error('❌ Failed to start Notification Service:', error);
    process.exit(1); // Başlangıçta hata olursa servisi durdur
  }
};

// --- Graceful Shutdown ---
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach(sig => {
  process.on(sig, async () => {
    logger.warn(`[NotificationSvc] Received ${sig}, starting graceful shutdown...`);
    // 1. RabbitMQ Consumer'larını ve bağlantısını kapat
    logger.info('[NotificationSvc] Closing RabbitMQ connections...');
    try {
        await rabbitmq.consumer.stopAll(); //
        await rabbitmq.connection.close(); //
        logger.info('[NotificationSvc] RabbitMQ connections closed.');
    } catch (mqCloseError) { logger.error('[NotificationSvc] Error closing RabbitMQ:', mqCloseError); }

    // (MongoDB bağlantısı olmadığı için o adımı atlıyoruz)

    // 2. Çıkış yap
    logger.info('[NotificationSvc] Shutdown complete.');
    process.exit(0);

    // Timeout
    setTimeout(() => { logger.error('[NotificationSvc] Force shutdown due to timeout.'); process.exit(1); }, 10000); // 10 saniye timeout
  });
});

startServer();