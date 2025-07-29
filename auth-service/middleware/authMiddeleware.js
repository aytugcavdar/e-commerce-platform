
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');

exports.protect = asyncHandler(async (req, res, next) => {
    let token;

    // Cookie'den token'ı okumayı dene
    if (req.cookies.token) {
        token = req.cookies.token;
    }
  

    console.log('Auth Middleware: Token bulundu mu?', token ? 'Evet' : 'Hayır'); // Kontrol 1: Token var mı?

    if (!token) {

        console.error(token, 'Token bulunamadı'); // Kontrol 1a: Token var mı? (Cookie'den okundu mu?)
        return next(new ErrorResponse('Bu rotaya erişim yetkiniz yok (Token bulunamadı)', 401));
    }

    try {
        // Token'ı doğrula
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Auth Middleware: Token doğrulandı, decoded payload:', decoded); // Kontrol 2: Token geçerli mi?

        // Kullanıcıyı ID ile bul ve req.user'a ata
        req.user = await User.findById(decoded.id);

        if (!req.user) {
           console.error('Auth Middleware: Token geçerli ama kullanıcı bulunamadı, ID:', decoded.id); // Kontrol 3a: Kullanıcı bulundu mu?
           return next(new ErrorResponse('Kullanıcı bulunamadı', 404));
        }

        console.log('Auth Middleware: req.user ayarlandı:', req.user.id); // Kontrol 3b: req.user ayarlandı mı?
        next(); // Her şey yolundaysa bir sonraki adıma geç
    } catch (err) {
        console.error('Auth Middleware: Token doğrulama hatası:', err); // Kontrol 4: Doğrulama hatası var mı?
        return next(new ErrorResponse('Bu rotaya erişim yetkiniz yok (Geçersiz Token)', 401));
    }
});

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new ErrorResponse(`Bu rotaya erişim yetkiniz yok (${req.user.role} rolü ile erişim sağlanamaz)`, 403));
        }
        next();
    };
}