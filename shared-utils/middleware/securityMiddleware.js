// shared-utils/middleware/securityMiddleware.js

const cors = require('cors');
const helmet = require('helmet');
const { httpStatus } = require('../constants');
const { ResponseFormatter } = require('../helpers');

class SecurityMiddleware {
  static corsMiddleware() {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    if (process.env.NODE_ENV === 'development' && !allowedOrigins.includes(`http://localhost:${process.env.CLIENT_PORT || 5173}`)) {
      // Geliştirme ortamında varsayılan frontend portunu ekleyelim (eğer yoksa)
      allowedOrigins.push(`http://localhost:${process.env.CLIENT_PORT || 5173}`);
    }

    const corsOptions = {
      // origin fonksiyonu, gelen isteğin Origin başlığını kontrol eder
      // ve izin verilenler listesinde varsa kabul eder.
      origin: (origin, callback) => {
        // Eğer istek aynı origin'den geliyorsa (veya origin yoksa - Postman gibi araçlar) izin ver.
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          // İzin verilmeyen bir origin ise hata ile callback yap.
          callback(new Error(`CORS policy does not allow access from origin ${origin}`), false);
        }
      },
      credentials: true, // Cookie gibi bilgilerin gönderilmesine izin ver. ✅
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // İzin verilen HTTP metodları. ✅
      allowedHeaders: ['Content-Type', 'Authorization'], // İzin verilen başlıklar. ✅
    };
    return cors(corsOptions);
  }

  /**
   * Helmet middleware'ini temel güvenlik ayarlarıyla yapılandırır.
   */
  static helmetMiddleware() {
    // Helmet, birçok güvenlik başlığını otomatik olarak ekler.
    // crossOriginResourcePolicy ayarı, Cloudinary gibi dış kaynaklardan resim yüklerken önemlidir.
    return helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" }
    });
  }

  
  static handleCorsError(err, req, res, next) {
    if (err.message.startsWith('CORS policy does not allow')) {
      return res.status(httpStatus.FORBIDDEN).json(ResponseFormatter.error(err.message, httpStatus.FORBIDDEN));
    }
    // Bu bir CORS hatası değilse, sonraki error handler'a devret.
    next(err);
  }
}

module.exports = SecurityMiddleware;