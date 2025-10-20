// shared-utils/middleware/rateLimitMiddleware.js

const rateLimit = require('express-rate-limit');
const { httpStatus } = require('../constants');
const { ResponseFormatter } = require('../helpers');
const { errorMessages } = require('../constants'); // Yeni errorMessages'ı kullanalım

class RateLimitMiddleware {
  /**
   * Genel bir rate limiter oluşturur.
   * @param {number} windowMs - Zaman aralığı (milisaniye).
   * @param {number} max - Bu aralıkta izin verilen maksimum istek sayısı.
   * @param {string} message - Limit aşıldığında gösterilecek mesaj.
   * @returns {Function} Express rate limit middleware'i.
   */
  static createLimiter(windowMs = 15 * 60 * 1000, max = 100, message = errorMessages.RATE_LIMIT_EXCEEDED) {
    return rateLimit({
      windowMs,
      max,
      // Mesajı standart ResponseFormatter ile döndürelim.
      handler: (req, res, next, options) => {
        res.status(options.statusCode).json(ResponseFormatter.error(options.message, options.statusCode));
      },
      statusCode: 429, // Too Many Requests
      message: message,
      standardHeaders: true, // `RateLimit-*` başlıklarını ekler (önerilir).
      legacyHeaders: false, // `X-RateLimit-*` başlıklarını devre dışı bırakır (önerilir).
      // Geliştirme ortamında limiti atlamak debugging için faydalı olabilir. ✅
      skip: (req) => process.env.NODE_ENV === 'development',
    });
  }

  // Farklı senaryolar için önceden tanımlanmış limiter'lar:
  // Genel API limiti (varsayılan)
  static generalLimiter = this.createLimiter(15 * 60 * 1000, 200); // 15dk - 200 istek

  // Hassas işlemler için daha sıkı limit (login, register, şifre sıfırlama)
  static authLimiter = this.createLimiter(15 * 60 * 1000, 10, 'Çok fazla kimlik doğrulama denemesi. Lütfen 15 dakika sonra tekrar deneyin.'); // 15dk - 10 istek

  // Dosya yükleme gibi daha maliyetli işlemler için limit
  static uploadLimiter = this.createLimiter(60 * 60 * 1000, 20); // 1 saat - 20 upload
}

module.exports = RateLimitMiddleware;