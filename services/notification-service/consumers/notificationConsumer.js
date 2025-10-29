const { rabbitmq, logger } = require('@ecommerce/shared-utils'); //
const EmailHandler = require('../handlers/emailHandler');

const { consumer } = rabbitmq; //

async function startConsumers() {
  try {
    logger.info('[Notification Consumer] Starting consumers...');

    const consumersToStart = [
      {
        queue: 'notification.order.created', // Sipariş oluşturuldu bildirimi
        handler: EmailHandler.sendOrderConfirmationEmail,
        options: { durable: true, prefetch: 5, requeueOnError: true } // E-posta gönderme hatasında tekrar denesin
      },
      {
        queue: 'notification.user.registered', // Yeni kullanıcı kayıt -> Doğrulama e-postası
        handler: EmailHandler.sendVerificationEmail,
        options: { durable: true, prefetch: 5, requeueOnError: true }
      },
       {
        queue: 'notification.user.forgot_password', // Şifre sıfırlama isteği
        handler: EmailHandler.sendPasswordResetEmail,
        options: { durable: true, prefetch: 5, requeueOnError: true }
      },
       {
        queue: 'notification.order.status_updated', // Sipariş durumu güncelleme
        handler: EmailHandler.sendOrderStatusUpdateEmail,
        options: { durable: true, prefetch: 5, requeueOnError: true }
      },
      // --- Eklenebilecek Diğer Bildirimler ---
      // {
      //   queue: 'notification.order.shipped', // Sipariş kargoya verildi
      //   handler: EmailHandler.sendOrderShippedEmail,
      //   options: { ... }
      // },
      // {
      //   queue: 'notification.payment.failed', // Ödeme başarısız bildirimi
      //   handler: EmailHandler.sendPaymentFailedEmail,
      //   options: { ... }
      // },
      // {
      //   queue: 'notification.inventory.low_stock', // Düşük stok uyarısı (Admin'e?)
      //   handler: EmailHandler.sendLowStockWarningEmail,
      //   options: { ... }
      // },
    ];

    await consumer.consumeMultiple(consumersToStart); //

    logger.info(`✅ [Notification Consumer] ${consumersToStart.length} consumers started successfully.`);

  } catch (error) {
    logger.error('❌ Failed to start Notification Service consumers:', error);
    process.exit(1); // Consumer'lar olmadan servis anlamsız
  }
}

module.exports = { startConsumers };