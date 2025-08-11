const asyncHandler = require('./asyncHandler');
const ErrorResponse = require('./errorResponse');
const jwt = require('jsonwebtoken'); // axios yerine jwt kullanacağız

// Token'ı doğrulayan ve kullanıcıyı req objesine ekleyen middleware
exports.protect = asyncHandler(async (req, res, next) => {
    let token;
    
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new ErrorResponse('Erişim yetkiniz yok (Token bulunamadı)', 401));
    }

    try {
        // Token'ı JWT_SECRET ile doğrula
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Diğer servislerin kullanması için req.user objesini oluştur
        req.user = { id: decoded.id, role: decoded.role, email: decoded.email };
        
        next();
    } catch (err) {
        return next(new ErrorResponse('Geçersiz Token', 401));
    }
});

// Kullanıcının rolüne göre yetkilendirme yapan middleware
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new ErrorResponse(
                `'${req.user ? req.user.role : 'guest'}' rolü bu işlemi yapmak için yetkili değil.`, 
                403
            ));
        }
        next();
    };
};