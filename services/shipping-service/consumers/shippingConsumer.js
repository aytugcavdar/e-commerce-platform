const { rabbitmq, logger } = require('@ecommerce/shared-utils');
const ShippingController = require('../controllers/shippingController');

const { consumer } = rabbitmq;

async function startConsumers() {
  try {
    logger.info('[Shipping Consumer] Starting consumers...');

    const consumersToStart = [
      {
        queue: 'order.confirmed',
        handler: ShippingController.handleInitiateShipping,
        options: { durable: true, prefetch: 1, requeueOnError: false }
      },
      {
        queue: 'payment.completed',
        handler: ShippingController.handleInitiateShipping,
        options: { durable: true, prefetch: 1, requeueOnError: false }
      },
      {
        queue: 'order.cancelled',
        handler: ShippingController.handleCancelShipping,
        options: { durable: true, prefetch: 5, requeueOnError: true }
      },
    ];

    await consumer.consumeMultiple(consumersToStart);

    logger.info(`✅ [Shipping Consumer] ${consumersToStart.length} consumers started successfully.`);

  } catch (error) {
    logger.error('❌ Failed to start Shipping Service consumers:', error);
    process.exit(1);
  }
}

module.exports = { startConsumers };