const jwt = require('jsonwebtoken');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');

exports.protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return next(new ErrorResponse('Bu rotaya erişim yetkiniz yok (Token bulunamadı)', 401));
    }

    try {
        // Token'ı doğrula ve içindeki kullanıcı ID'sini al
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // req.user objesine sadece kullanıcı ID'sini ve rolünü (varsa) ekle
        req.user = { 
            id: decoded.id,
            role: decoded.role 
        };

        next();
    } catch (err) {
        return next(new ErrorResponse('Geçersiz token. Erişim yetkiniz yok.', 401));
    }
});

exports.authorize = (...roles) => {
    return (req, res, next) => {
        // Not: Bu basit 'protect' fonksiyonu token'dan rolü okumaz.
        // Eğer cart-service içinde role göre yetkilendirme gerekirse,
        // token'a rol bilgisini de eklemeniz ve burada kontrol etmeniz gerekir.
        // Şimdilik cart-service'te role-based bir kısıtlama olmadığı için bu yeterli.
        next();
    };
}