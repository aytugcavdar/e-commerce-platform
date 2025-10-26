const Joi = require('joi');

class ProductValidators {
  /**
   * Create Product Schema
   */
  static createProductSchema() {
    return Joi.object({
      name: Joi.string().min(3).max(200).required().messages({
        'string.base': 'Ürün adı metin formatında olmalıdır.',
        'string.empty': 'Ürün adı boş bırakılamaz.',
        'string.min': 'Ürün adı en az 3 karakter olmalıdır.',
        'string.max': 'Ürün adı en fazla 200 karakter olabilir.',
        'any.required': 'Ürün adı zorunludur.',
      }),

      description: Joi.string().min(10).required().messages({
        'string.base': 'Açıklama metin formatında olmalıdır.',
        'string.empty': 'Açıklama boş bırakılamaz.',
        'string.min': 'Açıklama en az 10 karakter olmalıdır.',
        'any.required': 'Açıklama zorunludur.',
      }),

      price: Joi.number().min(0).required().messages({
        'number.base': 'Fiyat sayı formatında olmalıdır.',
        'number.min': 'Fiyat negatif olamaz.',
        'any.required': 'Fiyat zorunludur.',
      }),

      discountPrice: Joi.number().min(0).less(Joi.ref('price')).messages({
        'number.base': 'İndirimli fiyat sayı formatında olmalıdır.',
        'number.min': 'İndirimli fiyat negatif olamaz.',
        'number.less': 'İndirimli fiyat normal fiyattan düşük olmalıdır.',
      }),

      category: Joi.string().hex().length(24).required().messages({
        'string.hex': 'Geçersiz kategori ID formatı.',
        'string.length': 'Kategori ID uzunluğu geçersiz.',
        'any.required': 'Kategori zorunludur.',
      }),

      subcategory: Joi.string().hex().length(24).allow(null, '').messages({
        'string.hex': 'Geçersiz alt kategori ID formatı.',
        'string.length': 'Alt kategori ID uzunluğu geçersiz.',
      }),

      brand: Joi.string().hex().length(24).required().messages({
        'string.hex': 'Geçersiz marka ID formatı.',
        'string.length': 'Marka ID uzunluğu geçersiz.',
        'any.required': 'Marka zorunludur.',
      }),

      tags: Joi.alternatives().try(
        Joi.array().items(Joi.string().trim()),
        Joi.string() // Comma-separated string
      ).messages({
        'alternatives.types': 'Etiketler dizi veya metin formatında olmalıdır.',
      }),

      stock: Joi.number().integer().min(0).default(0).messages({
        'number.base': 'Stok sayı formatında olmalıdır.',
        'number.integer': 'Stok tam sayı olmalıdır.',
        'number.min': 'Stok negatif olamaz.',
      }),

      specifications: Joi.object().pattern(
        Joi.string(),
        Joi.string()
      ).messages({
        'object.base': 'Özellikler nesne formatında olmalıdır.',
      }),

      shipping: Joi.object({
        weight: Joi.number().min(0).messages({
          'number.base': 'Ağırlık sayı formatında olmalıdır.',
          'number.min': 'Ağırlık negatif olamaz.',
        }),
        dimensions: Joi.object({
          length: Joi.number().min(0),
          width: Joi.number().min(0),
          height: Joi.number().min(0),
        }),
        freeShipping: Joi.boolean(),
        shippingCost: Joi.number().min(0).default(0),
      }).messages({
        'object.base': 'Kargo bilgileri nesne formatında olmalıdır.',
      }),

      seo: Joi.object({
        metaTitle: Joi.string().max(70).messages({
          'string.max': 'Meta başlık en fazla 70 karakter olabilir.',
        }),
        metaDescription: Joi.string().max(160).messages({
          'string.max': 'Meta açıklama en fazla 160 karakter olabilir.',
        }),
        metaKeywords: Joi.array().items(Joi.string()),
      }).messages({
        'object.base': 'SEO bilgileri nesne formatında olmalıdır.',
      }),

      isFeatured: Joi.boolean().default(false),

      status: Joi.string()
        .valid('active', 'inactive', 'out-of-stock', 'discontinued')
        .default('active')
        .messages({
          'any.only': 'Geçersiz ürün durumu.',
        }),
    });
  }

  /**
   * Update Product Schema
   */
  static updateProductSchema() {
    return Joi.object({
      name: Joi.string().min(3).max(200).messages({
        'string.base': 'Ürün adı metin formatında olmalıdır.',
        'string.min': 'Ürün adı en az 3 karakter olmalıdır.',
        'string.max': 'Ürün adı en fazla 200 karakter olabilir.',
      }),

      description: Joi.string().min(10).messages({
        'string.base': 'Açıklama metin formatında olmalıdır.',
        'string.min': 'Açıklama en az 10 karakter olmalıdır.',
      }),

      price: Joi.number().min(0).messages({
        'number.base': 'Fiyat sayı formatında olmalıdır.',
        'number.min': 'Fiyat negatif olamaz.',
      }),

      discountPrice: Joi.number().min(0).messages({
        'number.base': 'İndirimli fiyat sayı formatında olmalıdır.',
        'number.min': 'İndirimli fiyat negatif olamaz.',
      }),

      category: Joi.string().hex().length(24).messages({
        'string.hex': 'Geçersiz kategori ID formatı.',
        'string.length': 'Kategori ID uzunluğu geçersiz.',
      }),

      subcategory: Joi.string().hex().length(24).allow(null, '').messages({
        'string.hex': 'Geçersiz alt kategori ID formatı.',
        'string.length': 'Alt kategori ID uzunluğu geçersiz.',
      }),

      brand: Joi.string().hex().length(24).messages({
        'string.hex': 'Geçersiz marka ID formatı.',
        'string.length': 'Marka ID uzunluğu geçersiz.',
      }),

      tags: Joi.alternatives().try(
        Joi.array().items(Joi.string().trim()),
        Joi.string()
      ),

      stock: Joi.number().integer().min(0).messages({
        'number.base': 'Stok sayı formatında olmalıdır.',
        'number.integer': 'Stok tam sayı olmalıdır.',
        'number.min': 'Stok negatif olamaz.',
      }),

      specifications: Joi.object().pattern(
        Joi.string(),
        Joi.string()
      ),

      shipping: Joi.object({
        weight: Joi.number().min(0),
        dimensions: Joi.object({
          length: Joi.number().min(0),
          width: Joi.number().min(0),
          height: Joi.number().min(0),
        }),
        freeShipping: Joi.boolean(),
        shippingCost: Joi.number().min(0),
      }),

      seo: Joi.object({
        metaTitle: Joi.string().max(70),
        metaDescription: Joi.string().max(160),
        metaKeywords: Joi.array().items(Joi.string()),
      }),

      isFeatured: Joi.boolean(),

      status: Joi.string()
        .valid('active', 'inactive', 'out-of-stock', 'discontinued')
        .messages({
          'any.only': 'Geçersiz ürün durumu.',
        }),
    }).min(1).messages({
      'object.min': 'En az bir alan güncellenmelidir.',
    });
  }

  /**
   * Update Stock Schema
   */
  static updateStockSchema() {
    return Joi.object({
      stock: Joi.number().integer().min(0).required().messages({
        'number.base': 'Stok sayı formatında olmalıdır.',
        'number.integer': 'Stok tam sayı olmalıdır.',
        'number.min': 'Stok negatif olamaz.',
        'any.required': 'Stok zorunludur.',
      }),
    });
  }

  /**
   * Query Parameters Schema for filtering products
   */
  static productQuerySchema() {
    return Joi.object({
      page: Joi.number().integer().min(1).default(1).messages({
        'number.base': 'Sayfa numarası sayı olmalıdır.',
        'number.integer': 'Sayfa numarası tam sayı olmalıdır.',
        'number.min': 'Sayfa numarası en az 1 olmalıdır.',
      }),

      limit: Joi.number().integer().min(1).max(100).default(20).messages({
        'number.base': 'Limit sayı olmalıdır.',
        'number.integer': 'Limit tam sayı olmalıdır.',
        'number.min': 'Limit en az 1 olmalıdır.',
        'number.max': 'Limit en fazla 100 olabilir.',
      }),

      sort: Joi.string().valid(
        'createdAt',
        '-createdAt',
        'price',
        '-price',
        'name',
        '-name',
        'stock',
        '-stock'
      ).default('-createdAt').messages({
        'any.only': 'Geçersiz sıralama parametresi.',
      }),

      search: Joi.string().trim().min(2).messages({
        'string.min': 'Arama terimi en az 2 karakter olmalıdır.',
      }),

      category: Joi.string().hex().length(24).messages({
        'string.hex': 'Geçersiz kategori ID formatı.',
        'string.length': 'Kategori ID uzunluğu geçersiz.',
      }),

      brand: Joi.string().hex().length(24).messages({
        'string.hex': 'Geçersiz marka ID formatı.',
        'string.length': 'Marka ID uzunluğu geçersiz.',
      }),

      minPrice: Joi.number().min(0).messages({
        'number.base': 'Minimum fiyat sayı olmalıdır.',
        'number.min': 'Minimum fiyat negatif olamaz.',
      }),

      maxPrice: Joi.number().min(0).greater(Joi.ref('minPrice')).messages({
        'number.base': 'Maksimum fiyat sayı olmalıdır.',
        'number.min': 'Maksimum fiyat negatif olamaz.',
        'number.greater': 'Maksimum fiyat minimum fiyattan büyük olmalıdır.',
      }),

      inStock: Joi.boolean(),

      isFeatured: Joi.boolean(),

      status: Joi.string()
        .valid('active', 'inactive', 'out-of-stock', 'discontinued')
        .default('active'),

      tags: Joi.string().trim(),
    });
  }
}

module.exports = ProductValidators;