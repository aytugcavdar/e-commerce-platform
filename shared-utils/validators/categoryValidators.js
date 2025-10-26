const Joi = require('joi');

class CategoryValidators{

    static createCategorySchema(){
        return Joi.object({
            name: Joi.string().min(3).max(200).required().messages({
                'string.base': 'Kategori adı metin formatında olmalıdır.',
                'string.empty': 'Kategori adı boş bırakılamaz.',
                'string.min': 'Kategori adı en az 3 karakter olmalıdır.',
                'string.max': 'Kategori adı en fazla 200 karakter olabilir.',
                'any.required': 'Kategori adı zorunludur.',
              }),
            description: Joi.string().min(10).max(1000).messages({
                'string.base': 'Açıklama metin formatında olmalıdır.',
                'string.min': 'Açıklama en az 10 karakter olmalıdır.',
                'string.max': 'Açıklama en fazla 1000 karakter olabilir.',
            }),
            parentId: Joi.string().hex().length(24).allow(null, '').messages({
                'string.hex': 'Geçersiz üst kategori ID formatı.',
                'string.length': 'Üst kategori ID uzunluğu geçersiz.',
            }),
            isActive: Joi.boolean().default(true),
            isFeatured: Joi.boolean().default(false),
            // image handled by multer, but if a URL is sent, validate it
            imageUrl: Joi.string().uri().allow(null, '').messages({
                'string.uri': 'Geçerli bir resim URL\'si girin.',
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
        });
    }

    static updateCategorySchema(){
        return Joi.object({
           name: Joi.string().min(3).max(200).messages({
                'string.base': 'Kategori adı metin formatında olmalıdır.',
                'string.empty': 'Kategori adı boş bırakılamaz.',
                'string.min': 'Kategori adı en az 3 karakter olmalıdır.',
                'string.max': 'Kategori adı en fazla 200 karakter olabilir.',
              }),
            description: Joi.string().min(10).max(1000).messages({
                'string.base': 'Açıklama metin formatında olmalıdır.',
                'string.min': 'Açıklama en az 10 karakter olmalıdır.',
                'string.max': 'Açıklama en fazla 1000 karakter olabilir.',
            }),
            parentId: Joi.string().hex().length(24).allow(null, '').messages({
                'string.hex': 'Geçersiz üst kategori ID formatı.',
                'string.length': 'Üst kategori ID uzunluğu geçersiz.',
            }),
            isActive: Joi.boolean(),
            isFeatured: Joi.boolean(),
            imageUrl: Joi.string().uri().allow(null, '').messages({
                'string.uri': 'Geçerli bir resim URL\'si girin.',
            }),
        });
    }
                


}
module.exports = CategoryValidators;