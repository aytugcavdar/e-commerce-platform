const Payment = require('../models/Payment');
const {
  helpers: { ResponseFormatter }, // shared-utils'dan
  constants: { httpStatus, errorMessages }, // shared-utils'dan
  logger, // shared-utils'dan
  rabbitmq: { publisher } // shared-utils'dan
} = require('@ecommerce/shared-utils');

class PaymentController {

  /**
   * (ASENKRON - RabbitMQ: payment.process olayını dinler)
   * Gelen ödeme talebini işler.
   * @param {object} payload - { orderId, userId, totalAmount, paymentMethod }
   */
  static async handleProcessPayment(payload) {
    const { orderId, userId, totalAmount, paymentMethod } = payload;
    logger.info(`Processing payment for order ${orderId}`);

    let payment;
    try {
      // 1. Ödeme kaydını oluştur (pending status)
      payment = new Payment({
        orderId,
        userId,
        amount: totalAmount,
        paymentMethod,
        status: 'pending',
      });
      await payment.save();
      logger.info(`Payment record created for order ${orderId} with status 'pending'`);

      // --- ÖDEME AĞ GEÇİDİ ENTEGRASYONU BURADA YAPILACAK ---
      // Gerçek bir ödeme ağ geçidi (Stripe, Iyzico vb.) ile iletişim kurulur.
      // Bu kısım seçilen sağlayıcıya göre değişir.
      // Şimdilik basitçe simüle edelim:
      const paymentSuccess = Math.random() > 0.1; // %90 başarı oranı varsayalım

      if (paymentSuccess) {
        // 2a. Başarılı ise durumu 'completed' yap ve transactionId ekle
        payment.status = 'completed';
        payment.transactionId = `txn_${Date.now()}_${orderId}`; // Örnek transaction ID
        payment.paymentGateway = 'simulated_gateway';
        payment.gatewayResponse = { success: true, message: 'Payment successful (Simulated)' };
        await payment.save();
        logger.info(`Payment successful for order ${orderId}. Status updated to 'completed'.`);

        // 3a. Başarılı olayını yayınla (Order Service ve Inventory Service dinleyebilir)
        await publisher.publish('payment.completed', {
          orderId: payment.orderId,
          transactionId: payment.transactionId,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          paymentDate: payment.updatedAt // Veya gateway'den gelen tarih
        });
        logger.info(`Event published: payment.completed for order ${orderId}`);

      } else {
        // 2b. Başarısız ise durumu 'failed' yap ve nedeni kaydet
        payment.status = 'failed';
        payment.failureReason = 'Payment gateway declined (Simulated)';
        payment.paymentGateway = 'simulated_gateway';
        payment.gatewayResponse = { success: false, message: 'Payment failed (Simulated)' };
        await payment.save();
        logger.warn(`Payment failed for order ${orderId}. Status updated to 'failed'.`);

        // 3b. Başarısız olayını yayınla (Order Service ve Inventory Service dinleyebilir)
        await publisher.publish('payment.failed', {
          orderId: payment.orderId,
          reason: payment.failureReason,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
        });
        logger.info(`Event published: payment.failed for order ${orderId}`);
      }
      // --- ÖDEME AĞ GEÇİDİ ENTEGRASYONU SONU ---

    } catch (error) {
      logger.error(`Error processing payment for order ${orderId}:`, error);
      // Hata durumunda ne yapılmalı?
      // - Eğer ödeme kaydı oluşturulduysa 'failed' olarak işaretle.
      // - 'payment.failed' olayı yayınla ki diğer servisler haberdar olsun.
      if (payment && payment.status === 'pending') {
        try {
          payment.status = 'failed';
          payment.failureReason = `Internal server error: ${error.message}`;
          await payment.save();
          await publisher.publish('payment.failed', {
            orderId: payment.orderId,
            reason: payment.failureReason,
            amount: payment.amount,
            paymentMethod: payment.paymentMethod,
          });
          logger.info(`Event published due to error: payment.failed for order ${orderId}`);
        } catch (saveError) {
          logger.error(`Critical error: Could not update payment status to failed for order ${orderId} after initial error:`, saveError);
        }
      }
      // Hatanın consumer tarafından nasıl ele alınacağını belirlemek için tekrar fırlatılabilir.
      // throw error; // Eğer requeue istenmiyorsa veya DLQ varsa.
    }
  }

  /**
   * (ASENKRON - RabbitMQ: payment.refund olayını dinler)
   * İade talebini işler.
   * @param {object} payload - { orderId, amount? }
   */
  static async handleRefundPayment(payload) {
    const { orderId, amount } = payload; // amount opsiyonel, belirtilmezse tümü iade edilir
    logger.info(`Processing refund for order ${orderId}`);

    try {
        const payment = await Payment.findOne({ orderId: orderId, status: 'completed' });

        if (!payment) {
            logger.warn(`Refund requested for order ${orderId}, but no completed payment found.`);
            // Belki bir olay yayınlanabilir veya sadece loglanır.
            return; // İşlem yapma
        }

        const refundAmount = typeof amount === 'number' ? Math.min(amount, payment.amount - payment.refundedAmount) : (payment.amount - payment.refundedAmount);

        if (refundAmount <= 0) {
            logger.warn(`Refund requested for order ${orderId}, but no refundable amount left.`);
            return;
        }

        // --- İADE AĞ GEÇİDİ ENTEGRASYONU ---
        // Gerçek ödeme ağ geçidi üzerinden iade işlemi yapılır.
        // Şimdilik simüle edelim:
        const refundSuccess = true; // İadenin başarılı olduğunu varsayalım

        if (refundSuccess) {
            payment.refundedAmount += refundAmount;
            payment.refundTransactionId = `ref_${Date.now()}_${orderId}`; // Örnek iade ID'si
            // Eğer tüm miktar iade edildiyse durumu 'refunded' yap
            if (payment.refundedAmount >= payment.amount) {
                payment.status = 'refunded';
            }
            // Gateway yanıtını kaydet
            payment.gatewayResponse = { ...(payment.gatewayResponse || {}), refund: { success: true, message: 'Refund successful (Simulated)' }};
            await payment.save();
            logger.info(`Refund successful for order ${orderId}. Amount: ${refundAmount}. New status: ${payment.status}.`);

            // İade başarılı olayını yayınla (Order Service dinleyebilir)
            await publisher.publish('payment.refunded', {
                orderId: payment.orderId,
                refundAmount: refundAmount,
                totalRefunded: payment.refundedAmount,
                refundTransactionId: payment.refundTransactionId,
                originalTransactionId: payment.transactionId,
            });
            logger.info(`Event published: payment.refunded for order ${orderId}`);

        } else {
            // İade başarısız olduysa logla ve belki manuel müdahale için işaretle
            payment.gatewayResponse = { ...(payment.gatewayResponse || {}), refund: { success: false, message: 'Refund failed (Simulated)' }};
            await payment.save(); // Yanıtı kaydet
            logger.error(`Refund failed for order ${orderId} via gateway.`);
            // Başarısız iade olayı yayınla
            await publisher.publish('payment.refund.failed', {
                orderId: payment.orderId,
                amount: refundAmount,
                reason: 'Gateway refund failed (Simulated)',
            });
            logger.info(`Event published: payment.refund.failed for order ${orderId}`);
        }
        // --- İADE AĞ GEÇİDİ ENTEGRASYONU SONU ---

    } catch (error) {
        logger.error(`Error processing refund for order ${orderId}:`, error);
        // 'payment.refund.failed' olayı yayınlanabilir.
        await publisher.publish('payment.refund.failed', {
            orderId: orderId,
            amount: amount,
            reason: `Internal server error: ${error.message}`,
        }).catch(pubErr => logger.error('Failed to publish refund.failed event after error:', pubErr));
    }
  }

    // --- Gerekirse eklenebilecek diğer metodlar ---
    // static handleCancelPayment(payload) { ... } // Ödeme işlemi devam ederken iptal
    // static getPaymentStatus(req, res) { ... } // Bir siparişin ödeme durumunu sorgulama (HTTP endpoint)
    // static handleWebhook(req, res) { ... } // Ödeme ağ geçidinden gelen webhook'ları işleme (HTTP endpoint)
}

module.exports = PaymentController;