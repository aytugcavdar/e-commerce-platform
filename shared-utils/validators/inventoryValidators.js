// services/inventory-service/validators/inventoryValidators.js

const Joi = require('joi');
const { constants } = require('@ecommerce/shared-utils');
const { errorMessages } = constants;

// Birden fazla ürünün stoğunu kontrol etmek için item şeması
const inventoryCheckItemSchema = Joi.object({
  productId: Joi.string().hex().length(24).required().messages({
    'string.hex': errorMessages.INVALID_ID_FORMAT + ' (productId)',
    'string.length': errorMessages.INVALID_ID_FORMAT + ' (productId)',
    'any.required': 'Ürün ID zorunludur.',
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    'number.min': 'Miktar en az 1 olmalıdır.',
    'any.required': 'Miktar zorunludur.',
  }),
});

class InventoryValidators {

  /**
   * Stok kontrolü (/check-bulk - POST) için body şeması.
   */
  static checkStockBulkSchema() {
    return Joi.object({
      items: Joi.array().items(inventoryCheckItemSchema).min(1).required().messages({
        'array.min': 'Kontrol edilecek en az bir ürün olmalıdır.',
        'any.required': 'Ürün listesi (items) zorunludur.',
      }),
    });
  }

  /**
   * Stok ayarlama (/inventory/:productId - PATCH) için body şeması.
   */
  static adjustStockSchema() {
    return Joi.object({
      adjustment: Joi.number().integer().optional(), // Artırma/azaltma miktarı
      newStock: Joi.number().integer().min(0).optional(), // Yeni stok miktarı
      lowStockThreshold: Joi.number().integer().min(0).allow(null).optional(), // Düşük stok eşiği (null = kaldır)
    }).or('adjustment', 'newStock', 'lowStockThreshold') // En az biri olmalı
      .messages({
        'object.missing': 'Güncelleme için `adjustment`, `newStock` veya `lowStockThreshold` alanlarından en az biri gereklidir.',
        'number.min': '{#label} değeri negatif olamaz.',
        'number.integer': '{#label} değeri tam sayı olmalıdır.',
      });
  }

  /**
   * Stok getirme (/inventory - GET) için query şeması.
   */
  static getInventoryQuerySchema() {
    return Joi.object({
      productIds: Joi.string().pattern(/^[0-9a-fA-F]{24}(,[0-9a-fA-F]{24})*$/).required().messages({ // Virgülle ayrılmış ObjectId listesi
         'string.pattern.base': '`productIds` query parametresi virgülle ayrılmış geçerli ObjectId\'ler içermelidir.',
         'any.required': '`productIds` query parametresi zorunludur.',
      }),
    });
  }

}

module.exports = InventoryValidators;