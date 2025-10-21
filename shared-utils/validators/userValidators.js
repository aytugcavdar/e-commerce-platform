const Joi = require("joi");
const { userRoles } = require("../constants");

class UserValidators {
  static registerSchema() {
    return Joi.object({
      firstName: Joi.string().min(2).max(50).required().messages({
        "string.base": "İsim metin formatında olmalıdır.",
        "string.empty": "İsim alanı boş bırakılamaz.",
        "string.min": "İsim en az 2 karakter olmalıdır.",
        "string.max": "İsim en fazla 50 karakter olabilir.",
        "any.required": "İsim alanı zorunludur.",
      }),

      lastName: Joi.string().min(2).max(50).required().messages({
        "string.base": "Soyisim metin formatında olmalıdır.",
        "string.empty": "Soyisim alanı boş bırakılamaz.",
        "string.min": "Soyisim en az 2 karakter olmalıdır.",
        "string.max": "Soyisim en fazla 50 karakter olabilir.",
        "any.required": "Soyisim alanı zorunludur.",
      }),

      email: Joi.string().trim().email().lowercase().required().messages({
        "string.base": "Email metin formatında olmalıdır.",
        "string.empty": "Email alanı boş bırakılamaz.",
        "string.email": "Geçerli bir email adresi girin.",
        "any.required": "Email alanı zorunludur.",
      }),

      password: Joi.string()
        .min(6)
        .max(100)
        .pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/)
        .required()
        .messages({
          "string.base": "Şifre metin formatında olmalıdır.",
          "string.empty": "Şifre alanı boş bırakılamaz.",
          "string.min": "Şifre en az 6 karakter olmalıdır.",
          "string.max": "Şifre en fazla 100 karakter olabilir.",
          "string.pattern.base":
            "Şifre en az bir büyük harf, bir rakam ve bir özel karakter içermelidir.",
          "any.required": "Şifre alanı zorunludur.",
        }),

      phone: Joi.string().pattern(/^[0-9]{10,15}$/).required().messages({
        "string.base": "Telefon numarası metin formatında olmalıdır.",
        "string.empty": "Telefon numarası alanı boş bırakılamaz.",
        "string.pattern.base": "Geçerli bir telefon numarası girin (10-15 rakam).",
        "any.required": "Telefon numarası alanı zorunludur.",
      }),
      role: Joi.string()
        .valid(userRoles.CUSTOMER, userRoles.ADMIN, userRoles.SELLER)
        .default(userRoles.CUSTOMER)
        .messages({
          "any.only": "Geçersiz kullanıcı rolü seçildi.",
        }),
    });
  }

  static loginSchema() {
    return Joi.object({
      email: Joi.string().trim().email().lowercase().required().messages({
        "string.email": "Geçerli bir email adresi girin.",
        "any.required": "Email alanı zorunludur.",
      }),
      password: Joi.string().min(6).required().messages({
        "string.min": "Şifre en az 6 karakter olmalıdır.",
        "any.required": "Şifre alanı zorunludur.",
      }),
    });
  }
  
}

module.exports = UserValidators;
