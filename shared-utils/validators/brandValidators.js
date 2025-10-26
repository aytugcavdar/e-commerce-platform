const Joi = require('joi');



class BrandValidators{

    static createBrandSchema(){
        return Joi.object({
            name: Joi.string().min(3).max(200).required().messages({
                'string.base': 'Ürün adı metin formatında olmalıdır.',
                'string.empty': 'Ürün adı boş bırakılamaz.',
                'string.min': 'Ürün adı en az 3 karakter olmalıdır.',
                'string.max': 'Ürün adı en fazla 200 karakter olabilir.',
                'any.required': 'Ürün adı zorunludur.',
              }),
              
            })
    }
    static updateBrandSchema() {
    return Joi.object({
      // Güncellemede alanlar zorunlu değildir (optional).
      name: Joi.string().trim().min(2).max(100).optional().messages({
        'string.min': 'Marka adı en az 2 karakter olmalıdır.',
        'string.max': 'Marka adı en fazla 100 karakter olabilir.',
        'string.base': 'Marka adı metin formatında olmalıdır.',
        'string.empty': 'Marka adı boş bırakılamaz.',
        
      }), 
      description: Joi.string().trim().max(1000).allow('').optional().messages({
        'string.max': 'Açıklama en fazla 1000 karakter olabilir.',
        'string.base': 'Açıklama metin formatında olmalıdır.',
        'string.empty': 'Açıklama boş bırakılamaz.',
        

      }), 
      website: Joi.string().trim().uri().allow('').optional().messages({
        'string.uri': 'Geçerli bir web sitesi URL\'si girin.',
        'string.base': 'Web sitesi URL\'si metin formatında olmalıdır.',
        'string.empty': 'Web sitesi URL\'si boş bırakılamaz.',
      }),
      socialMedia: Joi.object({
          facebook: Joi.string().trim().uri().allow('').optional(),
          instagram: Joi.string().trim().uri().allow('').optional(),
          twitter: Joi.string().trim().uri().allow('').optional(),
      }).optional(),
      isActive: Joi.boolean().optional(),
      isFeatured: Joi.boolean().optional(),
      
      deleteLogo: Joi.boolean().optional()
      
    }).min(1); 
  }

     

}
module.exports = BrandValidators;