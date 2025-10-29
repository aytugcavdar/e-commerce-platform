const { rabbitmq, logger } = require('@ecommerce/shared-utils');
const PaymentController = require('../controllers/paymentController');

const { consumer } = rabbitmq;

async function startConsumers() {
  try {
    logger.info('[Payment Consumer] Starting consumers...');

    const consumersToStart = [
      {
        queue: 'payment.process',
        handler: PaymentController.handleProcessPayment,
        options: { durable: true, prefetch: 1, requeueOnError: false }
      },
      {
        queue: 'payment.refund',
        handler: PaymentController.handleRefundPayment,
        options: { durable: true, prefetch: 1, requeueOnError: false }
      },
    ];

    await consumer.consumeMultiple(consumersToStart);

    logger.info(`✅ [Payment Consumer] ${consumersToStart.length} consumers started successfully.`);

  } catch (error) {
    logger.error('❌ Failed to start Payment Service consumers:', error);
    process.exit(1);
  }
}

module.exports = { startConsumers };