// services/inventory-service/controllers/inventoryController.js

const Inventory = require('../models/Inventory'); // Modelimizi import ediyoruz
const {
  middleware: { asyncHandler },
  helpers: { ResponseFormatter },
  constants: { httpStatus, errorMessages },
  logger,
  rabbitmq: { publisher } // Belki düşük stok uyarısı için lazım olur
} = require('@ecommerce/shared-utils');
const mongoose = require('mongoose');

class InventoryController {

  /**
   * (SENKRON - Order Service tarafından çağrılır)
   * Birden fazla ürünün istenen miktarda satılabilir stoğu olup olmadığını kontrol eder.
   * @route POST /api/inventory/check-bulk
   * @access Private (Servisler arası iletişim)
   * @body { items: [{ productId: "...", quantity: 1 }, ...] }
   */
  static checkStockBulk = asyncHandler(async (req, res, next) => {
    const { items } = req.body; // [{ productId, quantity }]

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(httpStatus.BAD_REQUEST).json(
        ResponseFormatter.error('Kontrol edilecek ürün listesi boş olamaz.', httpStatus.BAD_REQUEST)
      );
    }

    const productIds = items.map(item => new mongoose.Types.ObjectId(item.productId));
    const quantitiesNeeded = new Map(items.map(item => [item.productId.toString(), item.quantity]));

    // İlgili ürünlerin stok kayıtlarını veritabanından çek
    const inventoryRecords = await Inventory.find({ product: { $in: productIds } });

    let allAvailable = true;
    const unavailableItems = [];

    for (const item of items) {
      const record = inventoryRecords.find(inv => inv.product.toString() === item.productId.toString());
      const available = record ? record.availableQuantity : 0; // Modeldeki virtual'ı kullan

      if (!record || available < item.quantity) {
        allAvailable = false;
        unavailableItems.push({
          productId: item.productId,
          needed: item.quantity,
          available: available,
          // name: product.name // product-service'ten isim alınabilir ama şimdilik ID yeterli
        });
        logger.warn(`Stock check failed for product ${item.productId}: Needed ${item.quantity}, Available ${available}`);
      }
    }

    if (!allAvailable) {
        logger.warn('Stock check failed for one or more items.', { unavailableItems });
        // Başarısız cevabı, stokta olmayan ürün detaylarıyla birlikte döndürelim.
        return res.status(httpStatus.BAD_REQUEST).json(
            ResponseFormatter.error(
                errorMessages.INSUFFICIENT_STOCK || 'Stok yetersiz.',
                httpStatus.BAD_REQUEST,
                { allAvailable: false, unavailableItems }
            )
        );
    }

    // Her şey yolundaysa başarılı cevap dön
    logger.info('Stock check successful for all items.');
    res.status(httpStatus.OK).json(
        ResponseFormatter.success({ allAvailable: true }, 'Tüm ürünler için yeterli stok mevcut.')
    );
  });


  /**
   * (ASENKRON - RabbitMQ: order.created olayını dinler)
   * Sipariş oluşturulduğunda ürünlerin stoğunu rezerve eder (reservedQuantity'yi artırır).
   * Bu işlem ATOMİK olmalıdır.
   * @param {object} payload - { orderId, items: [{ productId, quantity }] }
   */
  static async handleReserveStock(payload) {
    const { orderId, items } = payload;
    logger.info(`Received stock reservation request for order ${orderId}`);

    const session = await mongoose.startSession(); // Transaction başlatıyoruz (opsiyonel ama daha güvenli)
    session.startTransaction();

    try {
      const updates = items.map(async (item) => {
        // Stoğu atomik olarak güncelle: reservedQuantity'yi artır
        // AMA SADECE satılabilir miktar (stock - reserved) yeterliyse!
        const updateResult = await Inventory.findOneAndUpdate(
          {
            product: new mongoose.Types.ObjectId(item.productId),
            // Koşul: stok - rezerve >= istenen miktar
            $expr: { $gte: [ { $subtract: ['$stockQuantity', '$reservedQuantity'] }, item.quantity ] }
          },
          {
            $inc: { reservedQuantity: item.quantity } // Rezerveyi artır
          },
          { new: true, session } // 'new: true' güncellenmiş belgeyi döndürür, session'ı kullan
        );

        // Eğer updateResult null ise, ya ürün bulunamadı ya da stok yetersizdi (koşul sağlanmadı).
        if (!updateResult) {
            logger.error(`Stock reservation failed for product ${item.productId} (Order: ${orderId}). Insufficient available stock or product not found.`);
            // Hata fırlatarak transaction'ı geri al (abort)
            throw new Error(`Insufficient stock or product not found for ${item.productId}`);
        }
        logger.info(`Stock reserved for product ${item.productId}: +${item.quantity}. New reserved: ${updateResult.reservedQuantity}`);
         // Düşük stok kontrolü
        if (updateResult.isLowStock) {
            // Düşük stok olayını yayınla (Notification service dinleyebilir)
            publisher.publish('inventory.low_stock', {
                productId: item.productId,
                availableQuantity: updateResult.availableQuantity,
                threshold: updateResult.lowStockThreshold
            }).catch(err => logger.warn(`Failed to publish low_stock event for ${item.productId}:`, err));
        }

      });

      // Tüm güncellemelerin bitmesini bekle
      await Promise.all(updates);

      // Tüm güncellemeler başarılıysa transaction'ı onayla (commit)
      await session.commitTransaction();
      logger.info(`✅ Stock successfully reserved for all items in order ${orderId}`);

    } catch (error) {
      // Herhangi bir güncelleme başarısız olursa transaction'ı geri al (abort)
      await session.abortTransaction();
      logger.error(`❌ Stock reservation failed for order ${orderId}, transaction aborted:`, error.message);
      // Başarısızlık olayını yayınla (Order service dinleyip siparişi iptal edebilir)
      publisher.publish('inventory.reservation.failed', {
          orderId,
          reason: error.message,
          items
      }).catch(err => logger.error(`Failed to publish reservation.failed event for order ${orderId}:`, err));
      // Consumer'ın mesajı NACK etmesi (tekrar denememesi) için hatayı tekrar fırlatabiliriz.
      // throw error; // Veya consumer mantığına bırakabiliriz.
    } finally {
      // Session'ı her zaman bitir
      await session.endSession();
    }
  }


  /**
   * (ASENKRON - RabbitMQ: order.cancelled veya payment.failed olaylarını dinler)
   * Rezerve edilmiş stoğu serbest bırakır (reservedQuantity'yi azaltır).
   * Bu işlem ATOMİK olmalıdır.
   * @param {object} payload - { orderId, items: [{ productId, quantity }] }
   */
  static async handleReleaseStock(payload) {
    const { orderId, items } = payload;
    logger.info(`Received stock release request for order ${orderId}`);

    // Transaction burada da kullanılabilir ama $inc genellikle yeterince atomiktir.
    // Basitlik için transaction kullanmayalım.
    try {
      const updates = items.map(async (item) => {
        // Stoğu atomik olarak güncelle: reservedQuantity'yi azalt
        // Sadece rezerve edilen miktar 0'dan büyükse azaltalım.
        const updateResult = await Inventory.findOneAndUpdate(
          {
            product: new mongoose.Types.ObjectId(item.productId),
            reservedQuantity: { $gte: item.quantity } // Rezerve >= bırakılacak miktar
          },
          {
            $inc: { reservedQuantity: -item.quantity } // Rezerveyi azalt
          },
          { new: true } // Güncellenmiş belgeyi al
        );

        if (!updateResult) {
            // Bu durum genellikle olmamalı (rezerve edilenden fazlası bırakılmaya çalışılıyor)
            logger.warn(`Stock release failed or unnecessary for product ${item.productId} (Order: ${orderId}). Reserved quantity might be less than release amount.`);
            // Belki hata fırlatmak yerine loglamak yeterlidir?
        } else {
            logger.info(`Stock released for product ${item.productId}: -${item.quantity}. New reserved: ${updateResult.reservedQuantity}`);
        }
      });
      await Promise.all(updates);
      logger.info(`✅ Stock successfully released for order ${orderId}`);

    } catch (error) {
      logger.error(`❌ Error during stock release for order ${orderId}:`, error.message);
      // Bu hatanın yönetimi kritik olabilir. Loglama önemlidir.
      // Belki bir 'inventory.release.failed' olayı yayınlanabilir.
    }
  }


  /**
   * (ASENKRON - RabbitMQ: payment.completed olayını dinler)
   * Ödeme tamamlandığında stoğu kesinleştirir (stockQuantity ve reservedQuantity'yi azaltır).
   * Bu işlem ATOMİK olmalıdır.
   * @param {object} payload - { orderId, items: [{ productId, quantity }] }
   */
  static async handleCommitStock(payload) {
    const { orderId, items } = payload;
    logger.info(`Received stock commit request for order ${orderId}`);

    // Transaction burada da kullanılabilir.
    try {
      const updates = items.map(async (item) => {
        // Stoğu atomik olarak güncelle: Hem stockQuantity hem reservedQuantity'yi azalt
        // Sadece rezerve edilen miktar yeterliyse yapalım.
        const updateResult = await Inventory.findOneAndUpdate(
          {
            product: new mongoose.Types.ObjectId(item.productId),
            reservedQuantity: { $gte: item.quantity } // Rezerve >= azaltılacak miktar
          },
          {
            $inc: {
                stockQuantity: -item.quantity,    // Gerçek stoğu azalt
                reservedQuantity: -item.quantity // Rezerveyi azalt
            }
          },
          { new: true }
        );

        if (!updateResult) {
            // Bu durum olmamalı (ödeme alındıysa stok rezerve edilmiş olmalıydı).
            logger.error(`🚨 CRITICAL: Stock commit failed for product ${item.productId} (Order: ${orderId}). Reserved quantity issue?`);
            // Hata fırlatıp işlemi durdurmak veya telafi mekanizması?
            throw new Error(`Stock commit failed for product ${item.productId}. Reserved quantity mismatch?`);
        } else {
             logger.info(`Stock committed for product ${item.productId}: -${item.quantity}. New stock: ${updateResult.stockQuantity}, New reserved: ${updateResult.reservedQuantity}`);
             // Stok azaldıktan sonra düşük stok kontrolü tekrar yapılabilir.
             if (updateResult.isLowStock) {
                 publisher.publish('inventory.low_stock', { /* ... */ }).catch(err => logger.warn('Failed to publish low_stock event:', err));
             }
        }
      });
      await Promise.all(updates);
      logger.info(`✅ Stock successfully committed for order ${orderId}`);

    } catch (error) {
      logger.error(`❌ CRITICAL: Error during stock commit for order ${orderId}:`, error.message);
      // Bu çok kritik bir hata. Stoklar azaltılamadı ama ödeme alındı!
      // 'inventory.commit.failed' olayı yayınlanmalı ve manuel müdahale gerekebilir.
      publisher.publish('inventory.commit.failed', { orderId, reason: error.message, items })
          .catch(err => logger.error(`Failed to publish commit.failed event for order ${orderId}:`, err));
      // throw error; // Consumer NACK etsin mi?
    }
  }


  /**
   * (SENKRON - Admin Paneli veya Product Service tarafından çağrılır)
   * Bir ürünün stoğunu manuel olarak ayarlar veya artırır/azaltır.
   * @route PATCH /api/inventory/:productId
   * @access Private/Admin
   * @body { adjustment: 10 } veya { newStock: 100 }
   */
  static adjustStock = asyncHandler(async (req, res, next) => {
    const { productId } = req.params;
    const { adjustment, newStock } = req.body; // adjustment (+/-) veya newStock (yeni değer)

    if (!mongoose.Types.ObjectId.isValid(productId)) { /* Bad Request */ }

    let updateOperation = {};
    if (typeof adjustment === 'number') {
        // $inc ile atomik artırma/azaltma
        updateOperation = { $inc: { stockQuantity: adjustment } };
    } else if (typeof newStock === 'number' && newStock >= 0) {
        // $set ile yeni değeri atomik olarak ayarlama
        updateOperation = { $set: { stockQuantity: newStock } };
    } else {
        return res.status(httpStatus.BAD_REQUEST).json(ResponseFormatter.error('Geçerli bir `adjustment` veya `newStock` değeri girilmelidir.', httpStatus.BAD_REQUEST));
    }

    try {
        // findOneAndUpdate atomik olarak çalışır. 'upsert: true' ürün için stok kaydı yoksa oluşturur.
        const updatedInventory = await Inventory.findOneAndUpdate(
            { product: new mongoose.Types.ObjectId(productId) },
            updateOperation,
            { new: true, upsert: true, runValidators: true } // upsert: true önemli!
        );

        logger.info(`Stock adjusted for product ${productId}. New stock: ${updatedInventory.stockQuantity}`);

         // Düşük stok kontrolü
        if (updatedInventory.isLowStock) {
            publisher.publish('inventory.low_stock', { /* ... */ }).catch(err => logger.warn('Failed to publish low_stock event:', err));
        }

        res.status(httpStatus.OK).json(
            ResponseFormatter.success(updatedInventory, 'Stok başarıyla güncellendi.')
        );

    } catch (error) {
        logger.error(`Failed to adjust stock for product ${productId}:`, error);
        next(error); // Genel error handler'a gönder
    }
  });

   /**
    * (SENKRON - Admin Paneli veya Diğer Servisler)
    * Bir veya daha fazla ürünün stok bilgisini getirir.
    * @route GET /api/inventory?productIds=id1,id2,... VEYA GET /api/inventory/:productId
    * @access Private/Admin veya Servisler
    */
   static getInventory = asyncHandler(async (req, res, next) => {
        const { productId } = req.params; // Tek ürün için
        const { productIds } = req.query; // Çoklu ürün için (virgülle ayrılmış)

        let filter = {};
        if (productId) {
            if (!mongoose.Types.ObjectId.isValid(productId)) { /* Bad Request */ }
            filter = { product: new mongoose.Types.ObjectId(productId) };
        } else if (productIds) {
            const ids = productIds.split(',').map(id => {
                if (!mongoose.Types.ObjectId.isValid(id.trim())) {
                    throw new Error(errorMessages.INVALID_ID_FORMAT + ` (${id.trim()})`);
                }
                return new mongoose.Types.ObjectId(id.trim());
            });
            filter = { product: { $in: ids } };
        } else {
            // Tüm stokları getirmek istenebilir (admin için, sayfalama ile)
            // Şimdilik ID olmadan istek gelirse hata döndürelim.
            return res.status(httpStatus.BAD_REQUEST).json(ResponseFormatter.error('Ürün ID(leri) belirtilmelidir.', httpStatus.BAD_REQUEST));
        }

        try {
            const inventory = await Inventory.find(filter).lean(); // lean() daha hızlı

            if (productId && (!inventory || inventory.length === 0)) {
                return res.status(httpStatus.NOT_FOUND).json(ResponseFormatter.error('Belirtilen ürün için stok kaydı bulunamadı.', httpStatus.NOT_FOUND));
            }

            // Tek ürün istendiyse obje, çoklu istendiyse dizi döndür
            const resultData = productId ? inventory[0] : inventory;

            res.status(httpStatus.OK).json(
                ResponseFormatter.success(resultData, 'Stok bilgisi başarıyla getirildi.')
            );
        } catch(error) {
            logger.error('Failed to get inventory:', error);
            next(error);
        }
   });

} // InventoryController sonu

module.exports = InventoryController;