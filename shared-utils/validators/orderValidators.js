const Joi = require('joi');

const orderItemSchema = Joi.object({
  product: Joi.string().hex().length(24).required().messages({
    'string.hex': 'Geçersiz ürün ID formatı.',
    'string.length': 'Ürün ID uzunluğu geçersiz.',
    'any.required': 'Ürün zorunludur.',
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    'number.base': 'Miktar sayı formatında olmalıdır.',
    'number.integer': 'Miktar tam sayı olmalıdır.',
    'number.min': 'Miktar en az 1 olmalıdır.',
    'any.required': 'Miktar zorunludur.',
  }),
});

const shippingAddressSchema = Joi.object({
  fullName: Joi.string().required().messages({
    'string.empty': 'Tam ad boş bırakılamaz.',
    'any.required': 'Tam ad zorunludur.',
  }),
  phone: Joi.string().required().messages({
    'string.empty': 'Telefon numarası boş bırakılamaz.',
    'any.required': 'Telefon numarası zorunludur.',
  }),
  addressLine1: Joi.string().required().messages({
    'string.empty': 'Adres satırı 1 boş bırakılamaz.',
    'any.required': 'Adres satırı 1 zorunludur.',
  }),
  addressLine2: Joi.string().allow('', null),
  city: Joi.string().required().messages({
    'string.empty': 'Şehir boş bırakılamaz.',
    'any.required': 'Şehir zorunludur.',
  }),
  state: Joi.string().required().messages({
    'string.empty': 'İlçe boş bırakılamaz.',
    'any.required': 'İlçe zorunludur.',
  }),
  postalCode: Joi.string().required().messages({
    'string.empty': 'Posta kodu boş bırakılamaz.',
    'any.required': 'Posta kodu zorunludur.',
  }),
  country: Joi.string().default('Turkey'),
});

class OrderValidators {
  /**
   * Create Order Schema
   */
  static createOrderSchema() {
    return Joi.object({
      items: Joi.array().items(orderItemSchema).min(1).required().messages({
        'array.base': 'Ürünler dizi formatında olmalıdır.',
        'array.min': 'Sepetinizde en az bir ürün bulunmalıdır.',
        'any.required': 'Ürünler zorunludur.',
      }),
      shippingAddress: shippingAddressSchema.required().messages({
        'any.required': 'Teslimat adresi zorunludur.',
      }),
      paymentMethod: Joi.string()
        .valid('credit_card', 'debit_card', 'bank_transfer', 'cash_on_delivery')
        .required()
        .messages({
          'any.only': 'Geçersiz ödeme yöntemi.',
          'any.required': 'Ödeme yöntemi zorunludur.',
        }),
      notes: Joi.string().allow('', null),
    });
  }

  /**
   * Update Order Status Schema
   */
  static updateOrderStatusSchema() {
    return Joi.object({
      status: Joi.string()
        .valid(
          'pending',
          'confirmed',
          'processing',
          'shipped',
          'out_for_delivery',
          'delivered',
          'cancelled',
          'returned',
          'refunded'
        )
        .required()
        .messages({
          'any.only': 'Geçersiz sipariş durumu.',
          'any.required': 'Sipariş durumu zorunludur.',
        }),
      note: Joi.string().allow('', null),
    });
  }

  /**
   * Order Query Schema
   */
  static orderQuerySchema() {
    return Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      sort: Joi.string().default('-createdAt'),
      status: Joi.string().valid(
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'out_for_delivery',
        'delivered',
        'cancelled',
        'returned',
        'refunded'
      ),
      paymentStatus: Joi.string().valid('pending', 'completed', 'failed', 'refunded'),
      user: Joi.string().hex().length(24),
      orderNumber: Joi.string(),
    });
  }
}

module.exports = OrderValidators;
