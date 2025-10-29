const Shipment = require('../models/Shipment');
const {
  helpers: { ResponseFormatter },
  constants: { httpStatus, errorMessages },
  logger,
  rabbitmq: { publisher }
} = require('@ecommerce/shared-utils'); //

// Simülasyon için kargo firmaları
const CARRIERS = ['Aras Kargo', 'MNG Kargo', 'Yurtiçi Kargo'];

class ShippingController {

  /**
   * (ASENKRON - RabbitMQ: order.confirmed veya payment.completed olayını dinler)
   * Sipariş için kargo kaydı oluşturur ve kargo sürecini başlatır.
   * @param {object} payload - { orderId, userId, shippingAddress, shippingCost, items? }
   */
  static async handleInitiateShipping(payload) {
    const { orderId, userId, shippingAddress, shippingCost } = payload;
    logger.info(`Initiating shipping process for order ${orderId}`);

    try {
      // 1. Kargo kaydı zaten var mı kontrol et
      let shipment = await Shipment.findOne({ orderId });
      if (shipment) {
        logger.warn(`Shipment record already exists for order ${orderId}. Skipping initiation.`);
        return; // Zaten işlem başlatılmışsa tekrar başlatma
      }

      // 2. Yeni kargo kaydı oluştur (pending status)
      shipment = new Shipment({
        orderId,
        userId,
        shippingAddress,
        shippingCost: shippingCost || 0,
        status: 'processing', // Direkt 'processing' ile başlatalım
        statusHistory: [{ status: 'processing' }]
      });
      await shipment.save();
      logger.info(`Shipment record created for order ${orderId} with status 'processing'`);

      // --- KARGO FİRMASI ENTEGRASYONU (Simülasyon) ---
      // Gerçek senaryoda burada kargo firmasının API'si çağrılır,
      // etiket oluşturulur, takip numarası alınır.

      // Simülasyon: Rastgele bir kargo firması seç ve takip no üret
      const carrier = CARRIERS[Math.floor(Math.random() * CARRIERS.length)];
      const trackingNumber = `TRK${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;
      const trackingUrl = `https://example-kargo-takip.com/?no=${trackingNumber}`; // Örnek URL

      // Simülasyon: Birkaç saniye sonra kargoya verildi olarak işaretle
      setTimeout(async () => {
        try {
          const updatedShipment = await Shipment.findOneAndUpdate(
            { orderId: orderId, status: 'processing' }, // Sadece işleniyorsa güncelle
            {
              status: 'shipped',
              carrier: carrier,
              trackingNumber: trackingNumber,
              trackingUrl: trackingUrl,
              // estimatedDeliveryDate: // Hesapla veya API'den al
            },
            { new: true }
          );

          if (updatedShipment) {
            logger.info(`Shipment for order ${orderId} marked as 'shipped'. Tracking: ${trackingNumber}`);

            // 4. Kargo durumu güncelleme olayını yayınla (Order Service dinleyebilir)
            await publisher.publish('shipping.status.updated', {
              orderId: updatedShipment.orderId,
              newStatus: 'shipped',
              trackingNumber: updatedShipment.trackingNumber,
              carrier: updatedShipment.carrier,
              trackingUrl: updatedShipment.trackingUrl,
            });
            logger.info(`Event published: shipping.status.updated (shipped) for order ${orderId}`);

            // SIMULASYON: Daha sonra 'delivered' durumunu da tetikleyebiliriz
            setTimeout(async () => {
                try {
                     const deliveredShipment = await Shipment.findOneAndUpdate(
                        { orderId: orderId, status: 'shipped' }, // Sadece kargodaysa güncelle
                        {
                            status: 'delivered',
                            actualDeliveryDate: new Date(),
                        }, { new: true }
                    );
                    if(deliveredShipment) {
                         logger.info(`Shipment for order ${orderId} marked as 'delivered'.`);
                         await publisher.publish('shipping.status.updated', {
                              orderId: deliveredShipment.orderId,
                              newStatus: 'delivered',
                              deliveryDate: deliveredShipment.actualDeliveryDate,
                         });
                         logger.info(`Event published: shipping.status.updated (delivered) for order ${orderId}`);
                    }
                } catch(deliveryError){
                     logger.error(`Error simulating delivery for order ${orderId}:`, deliveryError);
                }
            }, 15000); // 15 saniye sonra teslim edildi varsay


          }
        } catch (shipError) {
          logger.error(`Error updating shipment status to 'shipped' for order ${orderId}:`, shipError);
          // Hata yönetimi: Durumu 'failed' yap? Olay yayınla?
            try {
                const failedShipment = await Shipment.findOneAndUpdate(
                    { orderId: orderId, status: 'processing' },
                    { status: 'failed', $push: { statusHistory: { status: 'failed', notes: `Shipping error: ${shipError.message}` } } },
                    { new: true }
                );
                if (failedShipment) {
                    await publisher.publish('shipping.failed', { orderId: orderId, reason: shipError.message });
                    logger.info(`Event published: shipping.failed for order ${orderId}`);
                }
            } catch(failError){
                 logger.error(`Critical: Error marking shipment as failed for order ${orderId}:`, failError);
            }
        }
      }, 5000); // 5 saniye sonra kargoya verildi varsayalım

      // --- KARGO FİRMASI ENTEGRASYONU SONU ---

    } catch (error) {
      logger.error(`Error initiating shipping for order ${orderId}:`, error);
      // Hata olayını yayınla ki Order Service haberdar olsun?
       await publisher.publish('shipping.failed', {
            orderId: orderId,
            reason: `Initiation error: ${error.message}`
       }).catch(pubErr => logger.error(`Failed to publish shipping.failed event after initiation error for ${orderId}:`, pubErr));
    }
  }

  /**
   * (ASENKRON - RabbitMQ: order.cancelled olayını dinler)
   * İptal edilen siparişin kargo işlemini iptal eder (eğer henüz kargoya verilmediyse).
   * @param {object} payload - { orderId }
   */
  static async handleCancelShipping(payload) {
    const { orderId } = payload;
    logger.info(`Attempting to cancel shipping for order ${orderId}`);

    try {
        // Kargoyu bul ve sadece 'pending' veya 'processing' durumundaysa iptal et
        const shipment = await Shipment.findOneAndUpdate(
            { orderId: orderId, status: { $in: ['pending', 'processing'] } },
            {
                status: 'cancelled',
                $push: { statusHistory: { status: 'cancelled', notes: 'Order cancelled' } }
            },
            { new: true }
        );

        if (shipment) {
            logger.info(`Shipping cancelled successfully for order ${orderId}`);
            // İptal edildi olayı yayınlamaya gerek var mı? Order service zaten biliyor.
            // Belki kargo firması API'sine iptal isteği gönderilebilir.

        } else {
            const existingShipment = await Shipment.findOne({ orderId });
            if (existingShipment) {
                 logger.warn(`Shipping for order ${orderId} could not be cancelled. Status: ${existingShipment.status}`);
                 // Belki manuel müdahale için bir olay yayınlanabilir.
            } else {
                logger.warn(`Shipping cancellation request for order ${orderId}, but no shipment record found.`);
            }
        }

    } catch (error) {
        logger.error(`Error cancelling shipping for order ${orderId}:`, error);
        // Hata yönetimi
    }
  }

  // --- İsteğe Bağlı HTTP Endpointleri ---

  /**
   * Kargo durumunu ID ile getir (Admin veya Kullanıcı için)
   * @route GET /api/shipping/:orderId
   * @access Private
   */
  static getShipmentStatus = asyncHandler(async (req, res, next) => {
      const { orderId } = req.params;
      // TODO: Yetkilendirme eklenmeli (sipariş sahibi veya admin)

      const shipment = await Shipment.findOne({ orderId }).lean();

      if (!shipment) {
          return res.status(httpStatus.NOT_FOUND).json(
              ResponseFormatter.error('Bu sipariş için kargo bilgisi bulunamadı', httpStatus.NOT_FOUND)
          );
      }

      res.status(httpStatus.OK).json(
          ResponseFormatter.success(shipment, 'Kargo bilgisi getirildi')
      );
  });

  /**
   * Kargo durumunu manuel güncelle (Admin için)
   * @route PATCH /api/shipping/:orderId/status
   * @access Private/Admin
   */
  static updateShipmentStatus = asyncHandler(async (req, res, next) => {
       const { orderId } = req.params;
       const { status, notes, location, trackingNumber, carrier } = req.body;
       // TODO: Gelen status geçerli mi kontrol et (enum içinde mi?)

       const shipment = await Shipment.findOne({ orderId });
       if (!shipment) {
           return res.status(httpStatus.NOT_FOUND).json(
               ResponseFormatter.error('Kargo kaydı bulunamadı', httpStatus.NOT_FOUND)
           );
       }

       const oldStatus = shipment.status;
       shipment.status = status;

       // Yeni geçmiş kaydı için detayları ekle
       const historyEntry = { status, notes, location, timestamp: new Date() };
       shipment.statusHistory.push(historyEntry);

       // Ek bilgileri güncelle
       if (trackingNumber) shipment.trackingNumber = trackingNumber;
       if (carrier) shipment.carrier = carrier;
       if (status === 'delivered') shipment.actualDeliveryDate = new Date();

       await shipment.save();
       logger.info(`Shipment status manually updated for order ${orderId} to ${status}`);

       // Durum değişikliği olayını yayınla
       if (oldStatus !== status) {
            await publisher.publish('shipping.status.updated', {
              orderId: shipment.orderId,
              newStatus: status,
              trackingNumber: shipment.trackingNumber,
              carrier: shipment.carrier,
              // ... diğer ilgili bilgiler
            }).catch(pubErr => logger.error(`Failed to publish manual status update event for ${orderId}:`, pubErr));
       }

       res.status(httpStatus.OK).json(
           ResponseFormatter.success(shipment, 'Kargo durumu güncellendi')
       );
  });

}

module.exports = ShippingController;