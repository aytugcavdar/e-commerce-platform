const ErrorResponse = require("../utils/errorResponse");

/**
 * Express hata yakalayıcı middleware
 * Tüm hataları yakalayarak ErrorResponse nesnesine çevirir ve client'a düzgün JSON formatında gönderir.
 */
const errorHandler = (err, req, res, next) => {
  // ErrorResponse sınıfına dönüştür (zaten oysa dokunma)
  const error = ErrorResponse.fromError(err);

  // Geliştirme ortamındaysak stack trace'i logla
  if (process.env.NODE_ENV === "development") {
    console.error("🔴 [HATA]:", error.message);
    console.error("🔧 [STACK]:", err.stack);
  }

  // Hata yanıtını JSON olarak döndür
  res.status(error.statusCode || 500).json(error.toJSON());
};

module.exports = errorHandler;
