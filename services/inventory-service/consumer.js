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
        queue: 'inventory.reserve', // ✅ DÜZELTME: 'order.created' yerine 'inventory.reserve'
        handler: InventoryController.handleReserveStock,
        options: { durable: true, prefetch: 1, requeueOnError: false }
      },
      {
        queue: 'order.cancelled',
        handler: InventoryController.handleReleaseStock,
        options: { durable: true, prefetch: 5, requeueOnError: true }
      },
      {
        queue: 'payment.failed',
        handler: InventoryController.handleReleaseStock,
        options: { durable: true, prefetch: 5, requeueOnError: true }
      },
      {
        queue: 'payment.completed',
        handler: InventoryController.handleCommitStock,
        options: { durable: true, prefetch: 1, requeueOnError: false }
      },
      {
        queue: 'product.stock.increase',
        handler: InventoryController.handleStockIncrease,
        options: { durable: true, prefetch: 5, requeueOnError: true }
      }
    ];

    await consumer.consumeMultiple(consumersToStart);
    logger.info(`✅ [Inventory Consumer] ${consumersToStart.length} consumers started successfully.`);

  } catch (error) {
    logger.error('❌ Failed to start Inventory Service consumers:', error);
    process.exit(1);
  }
}

module.exports = { startConsumers };