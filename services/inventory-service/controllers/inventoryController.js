// services/inventory-service/controllers/inventoryController.js

const Inventory = require('../models/Inventory');
const {
  middleware: { asyncHandler },
  helpers: { ResponseFormatter },
  constants: { httpStatus, errorMessages },
  logger,
  rabbitmq: { publisher }
} = require('@ecommerce/shared-utils');
const mongoose = require('mongoose');

class InventoryController {

  /**
   * (SENKRON - Order Service tarafından çağrılır)
   * Birden fazla ürünün istenen miktarda satılabilir stoğu olup olmadığını kontrol eder.
   */
  static checkStockBulk = asyncHandler(async (req, res, next) => {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(httpStatus.BAD_REQUEST).json(
        ResponseFormatter.error('Kontrol edilecek ürün listesi boş olamaz.', httpStatus.BAD_REQUEST)
      );
    }

    const productIds = items.map(item => new mongoose.Types.ObjectId(item.productId));
    const inventoryRecords = await Inventory.find({ productId: { $in: productIds } });

    let allAvailable = true;
    const unavailableItems = [];

    for (const item of items) {
      const record = inventoryRecords.find(inv => inv.productId.toString() === item.productId.toString());
      const available = record ? (record.stockQuantity - record.reservedQuantity) : 0;

      if (!record || available < item.quantity) {
        allAvailable = false;
        unavailableItems.push({
          productId: item.productId,
          needed: item.quantity,
          available: available,
        });
        logger.warn(`Stock check failed for product ${item.productId}: Needed ${item.quantity}, Available ${available}`);
      }
    }

    if (!allAvailable) {
      return res.status(httpStatus.OK).json( 
        ResponseFormatter.success(
          { allAvailable: false, unavailableItems },
          'Stokta olmayan ürünler var'
        )
      );
    }

    logger.info('Stock check successful for all items.');
    res.status(httpStatus.OK).json(
        ResponseFormatter.success({ allAvailable: true }, 'Tüm ürünler için yeterli stok mevcut.')
    );
  });

  /**
   * (ASENKRON - RabbitMQ: inventory.reserve)
   * Sipariş oluşturulduğunda ürünlerin stoğunu rezerve eder
   */
  static async handleReserveStock(payload) {
    const { orderId, items } = payload;
    logger.info(`Received stock reservation request for order ${orderId}`);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const updates = items.map(async (item) => {
        const updateResult = await Inventory.findOneAndUpdate(
          {
            productId: new mongoose.Types.ObjectId(item.productId),
            $expr: { $gte: [ { $subtract: ['$stockQuantity', '$reservedQuantity'] }, item.quantity ] }
          },
          {
            $inc: { reservedQuantity: item.quantity }
          },
          { new: true, session }
        );

        if (!updateResult) {
            logger.error(`Stock reservation failed for product ${item.productId} (Order: ${orderId}). Insufficient available stock or product not found.`);
            throw new Error(`Insufficient stock or product not found for ${item.productId}`);
        }
        logger.info(`Stock reserved for product ${item.productId}: +${item.quantity}. New reserved: ${updateResult.reservedQuantity}`);
        
        if (updateResult.isLowStock) {
            publisher.publish('inventory.low_stock', {
                productId: item.productId,
                availableQuantity: updateResult.stockQuantity - updateResult.reservedQuantity,
                threshold: updateResult.lowStockThreshold
            }).catch(err => logger.warn(`Failed to publish low_stock event for ${item.productId}:`, err));
        }
      });

      await Promise.all(updates);
      await session.commitTransaction();
      logger.info(`✅ Stock successfully reserved for all items in order ${orderId}`);

    } catch (error) {
      await session.abortTransaction();
      logger.error(`❌ Stock reservation failed for order ${orderId}, transaction aborted:`, error.message);
      
      publisher.publish('inventory.reservation.failed', {
          orderId,
          reason: error.message,
          items
      }).catch(err => logger.error(`Failed to publish reservation.failed event for order ${orderId}:`, err));
    } finally {
      await session.endSession();
    }
  }

  /**
   * (ASENKRON - RabbitMQ: order.cancelled, payment.failed)
   * Rezerve edilmiş stoğu serbest bırakır
   */
  static async handleReleaseStock(payload) {
    const { orderId, items } = payload;
    logger.info(`Received stock release request for order ${orderId}`);

    try {
      const updates = items.map(async (item) => {
        const updateResult = await Inventory.findOneAndUpdate(
          {
            productId: new mongoose.Types.ObjectId(item.productId),
            reservedQuantity: { $gte: item.quantity }
          },
          {
            $inc: { reservedQuantity: -item.quantity }
          },
          { new: true }
        );

        if (!updateResult) {
            logger.warn(`Stock release failed or unnecessary for product ${item.productId} (Order: ${orderId}). Reserved quantity might be less than release amount.`);
        } else {
            logger.info(`Stock released for product ${item.productId}: -${item.quantity}. New reserved: ${updateResult.reservedQuantity}`);
        }
      });
      await Promise.all(updates);
      logger.info(`✅ Stock successfully released for order ${orderId}`);

    } catch (error) {
      logger.error(`❌ Error during stock release for order ${orderId}:`, error.message);
    }
  }

  /**
   * ✅ DÜZELTME: (ASENKRON - RabbitMQ: payment.completed)
   * Ödeme tamamlandığında stoğu kesinleştirir
   */
  static async handleCommitStock(payload) {
    const { orderId, items } = payload;
    logger.info(`🔵 Received stock commit request for order ${orderId}`);

    // ✅ Transaction ekle
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const updates = items.map(async (item) => {
        logger.info(`  🔹 Committing stock for product ${item.productId}, quantity: ${item.quantity}`);

        const updateResult = await Inventory.findOneAndUpdate(
          {
            productId: new mongoose.Types.ObjectId(item.productId),
            reservedQuantity: { $gte: item.quantity }
          },
          {
            $inc: {
                stockQuantity: -item.quantity,
                reservedQuantity: -item.quantity
            }
          },
          { new: true, session } // ✅ session ekle
        );

        if (!updateResult) {
            logger.error(`🚨 CRITICAL: Stock commit failed for product ${item.productId} (Order: ${orderId}). Reserved quantity issue?`);
            throw new Error(`Stock commit failed for product ${item.productId}. Reserved quantity mismatch?`);
        }

        logger.info(`  ✅ Stock committed for product ${item.productId}: -${item.quantity}. New stock: ${updateResult.stockQuantity}, New reserved: ${updateResult.reservedQuantity}`);
        
        if (updateResult.isLowStock) {
            publisher.publish('inventory.low_stock', { 
              productId: item.productId,
              availableQuantity: updateResult.stockQuantity - updateResult.reservedQuantity,
              threshold: updateResult.lowStockThreshold
            }).catch(err => logger.warn('Failed to publish low_stock event:', err));
        }
      });

      await Promise.all(updates);
      await session.commitTransaction(); // ✅ Commit yap
      logger.info(`✅ Stock successfully committed for order ${orderId}`);

    } catch (error) {
      await session.abortTransaction(); // ✅ Hata durumunda rollback
      logger.error(`❌ CRITICAL: Error during stock commit for order ${orderId}:`, error.message);
      
      publisher.publish('inventory.commit.failed', { orderId, reason: error.message, items })
          .catch(err => logger.error(`Failed to publish commit.failed event for order ${orderId}:`, err));
    } finally {
      await session.endSession(); // ✅ Session'ı kapat
    }
  }

  /**
   * (ASENKRON - RabbitMQ: product.stock.increase)
   * Ürün stoğunu artırır
   */
  static async handleStockIncrease(payload) {
    const { orderId, items } = payload;
    logger.info(`Received stock increase request from ${orderId}`);

    try {
      const updates = items.map(async (item) => {
        const inventory = await Inventory.findOne({ 
          productId: new mongoose.Types.ObjectId(item.productId) 
        });

        if (inventory) {
          inventory.stockQuantity += item.quantity;
          await inventory.save();
          logger.info(`Stock increased for product ${item.productId}: +${item.quantity}. New stock: ${inventory.stockQuantity}`);
        } else {
          const newInventory = new Inventory({
            productId: new mongoose.Types.ObjectId(item.productId),
            stockQuantity: item.quantity,
            reservedQuantity: 0,
            lowStockThreshold: 5
          });
          await newInventory.save();
          logger.info(`New inventory record created for product ${item.productId} with stock: ${item.quantity}`);
        }
      });

      await Promise.all(updates);
      logger.info(`✅ Stock increase completed for ${orderId}`);

    } catch (error) {
      logger.error(`❌ Stock increase failed for ${orderId}:`, error.message);
    }
  }

  /**
   * (SENKRON - Admin/Product Service)
   * Bir ürünün stoğunu manuel olarak ayarlar
   */
  static adjustStock = asyncHandler(async (req, res, next) => {
    const { productId } = req.params;
    const { adjustment, newStock } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(httpStatus.BAD_REQUEST).json(
        ResponseFormatter.error(errorMessages.INVALID_ID_FORMAT, httpStatus.BAD_REQUEST)
      );
    }

    let updateOperation = {};
    if (typeof adjustment === 'number') {
        updateOperation = { $inc: { stockQuantity: adjustment } };
    } else if (typeof newStock === 'number' && newStock >= 0) {
        updateOperation = { $set: { stockQuantity: newStock } };
    } else {
        return res.status(httpStatus.BAD_REQUEST).json(
          ResponseFormatter.error('Geçerli bir `adjustment` veya `newStock` değeri girilmelidir.', httpStatus.BAD_REQUEST)
        );
    }

    try {
        const updatedInventory = await Inventory.findOneAndUpdate(
            { product: new mongoose.Types.ObjectId(productId) },
            updateOperation,
            { new: true, upsert: true, runValidators: true }
        );

        logger.info(`Stock adjusted for product ${productId}. New stock: ${updatedInventory.stockQuantity}`);

        if (updatedInventory.isLowStock) {
            publisher.publish('inventory.low_stock', {
              productId,
              availableQuantity: updatedInventory.stockQuantity - updatedInventory.reservedQuantity,
              threshold: updatedInventory.lowStockThreshold
            }).catch(err => logger.warn('Failed to publish low_stock event:', err));
        }

        res.status(httpStatus.OK).json(
            ResponseFormatter.success(updatedInventory, 'Stok başarıyla güncellendi.')
        );

    } catch (error) {
        logger.error(`Failed to adjust stock for product ${productId}:`, error);
        next(error);
    }
  });

  /**
   * (SENKRON - Admin/Servisler)
   * Bir veya daha fazla ürünün stok bilgisini getirir
   */
  static getInventory = asyncHandler(async (req, res, next) => {
    const { productId } = req.params;
    const { productIds } = req.query;

    let filter = {};
    if (productId) {
        if (!mongoose.Types.ObjectId.isValid(productId)) {
          return res.status(httpStatus.BAD_REQUEST).json(
            ResponseFormatter.error(errorMessages.INVALID_ID_FORMAT, httpStatus.BAD_REQUEST)
          );
        }
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
        return res.status(httpStatus.BAD_REQUEST).json(
          ResponseFormatter.error('Ürün ID(leri) belirtilmelidir.', httpStatus.BAD_REQUEST)
        );
    }

    try {
        const inventory = await Inventory.find(filter).lean();

        if (productId && (!inventory || inventory.length === 0)) {
            return res.status(httpStatus.NOT_FOUND).json(
              ResponseFormatter.error('Belirtilen ürün için stok kaydı bulunamadı.', httpStatus.NOT_FOUND)
            );
        }

        const resultData = productId ? inventory[0] : inventory;

        res.status(httpStatus.OK).json(
            ResponseFormatter.success(resultData, 'Stok bilgisi başarıyla getirildi.')
        );
    } catch(error) {
        logger.error('Failed to get inventory:', error);
        next(error);
    }
  });
}

module.exports = InventoryController;