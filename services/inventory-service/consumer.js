// services/inventory-service/consumer.js

const { rabbitmq, logger } = require('@ecommerce/shared-utils');
const InventoryController = require('./controllers/inventoryController');

const { consumer } = rabbitmq; // Shared-utils'daki consumer helper'ını alıyoruz

/**
 * RabbitMQ olaylarını dinleyip ilgili controller fonksiyonlarını çağırır.
 */
async function startConsumers() {
  try {
    logger.info('[Inventory Consumer] Starting consumers...');

    const consumersToStart = [
      {
        queue: 'order.created', // Sipariş Oluşturuldu -> Stok Rezerve Et
        handler: InventoryController.handleReserveStock,
        options: { durable: true, prefetch: 1, requeueOnError: false } // Tek tek işle, hata olursa tekrar deneme
      },
      {
        queue: 'order.cancelled', // Sipariş İptal Edildi -> Stoğu Serbest Bırak
        handler: InventoryController.handleReleaseStock,
        options: { durable: true, prefetch: 5, requeueOnError: true } // Hata olursa tekrar dene? Belki false olmalı?
      },
      {
        queue: 'payment.failed', // Ödeme Başarısız -> Stoğu Serbest Bırak
        handler: InventoryController.handleReleaseStock, // Aynı fonksiyonu kullanabilir
        options: { durable: true, prefetch: 5, requeueOnError: true } // Hata olursa tekrar dene? Belki false olmalı?
      },
      {
        queue: 'payment.completed', // Ödeme Tamamlandı -> Stoğu Kesinleştir
        handler: InventoryController.handleCommitStock,
        options: { durable: true, prefetch: 1, requeueOnError: false } // Tek tek işle, hata olursa tekrar deneme (ÇOK DİKKATLİ OL!)
      },
      // === İLERİ SEVİYE / OPSİYONEL ===
      // {
      //   queue: 'product.created', // Yeni ürün eklendi -> Stok kaydı oluştur
      //   handler: InventoryController.handleProductCreated, // Bu fonksiyon yazılmalı
      //   options: { durable: true }
      // },
      // {
      //   queue: 'product.deleted', // Ürün silindi -> Stok kaydını sil
      //   handler: InventoryController.handleProductDeleted, // Bu fonksiyon yazılmalı
      //   options: { durable: true }
      // }
    ];

    // Shared-utils'daki consumeMultiple helper'ını kullanalım
    await consumer.consumeMultiple(consumersToStart);

    logger.info(`✅ [Inventory Consumer] ${consumersToStart.length} consumers started successfully.`);

  } catch (error) {
    logger.error('❌ Failed to start Inventory Service consumers:', error);
    // Consumer'lar olmadan servis çalışmamalı. Uygulamayı durdur.
    process.exit(1);
  }
}

module.exports = { startConsumers };