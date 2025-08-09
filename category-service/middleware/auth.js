const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const axios = require('axios');

exports.protect = asyncHandler(async (req, res, next) => {
    let token;
    
    // 1. Cookie'den token'ı al
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
        console.log('🍪 Token cookie\'den alındı:', token ? 'Var' : 'Yok');
    }
    
    // 2. Authorization header'dan token'ı al (fallback)
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
        console.log('🔑 Token authorization header\'dan alındı:', token ? 'Var' : 'Yok');
    }

    if (!token) {
        console.error('❌ Token bulunamadı - Cookie ve Authorization header boş');
        return next(new ErrorResponse('Erişim yetkiniz yok (Token bulunamadı)', 401));
    }

    try {
        console.log('🔄 Auth service\'e doğrulama isteği gönderiliyor...');
        
        // Auth service'e kullanıcı doğrulama isteği gönder
        const response = await axios.get('http://localhost:5001/me', {
            headers: { 
                'Cookie': `token=${token}`,
                'Content-Type': 'application/json'
            },
            timeout: 5000 // 5 saniye timeout
        });

        console.log('✅ Auth service yanıtı alındı:', {
            status: response.status,
            hasData: !!response.data,
            hasUser: !!(response.data && response.data.data && response.data.data.user)
        });

        // Yanıtı kontrol et
        if (!response.data || !response.data.success || !response.data.data || !response.data.data.user) {
            console.error('❌ Auth service\'ten geçersiz yanıt:', response.data);
            return next(new ErrorResponse('Kullanıcı doğrulama başarısız', 401));
        }

        // Kullanıcı bilgilerini req.user'a ata
        req.user = response.data.data.user;
        
        console.log('👤 Kullanıcı doğrulandı:', {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role
        });
        
        next();
    } catch (err) {
        console.error('❌ Auth service iletişim hatası:', {
            message: err.message,
            code: err.code,
            status: err.response?.status,
            data: err.response?.data
        });

        // Axios hatası detaylarını kontrol et
        if (err.response) {
            // Server yanıt verdi ama hata kodu ile
            return next(new ErrorResponse(`Auth service hatası: ${err.response.data?.message || 'Doğrulama başarısız'}`, 401));
        } else if (err.request) {
            // İstek gönderildi ama yanıt alınamadı
            return next(new ErrorResponse('Auth service\'e erişilemedi. Lütfen daha sonra tekrar deneyin.', 503));
        } else {
            // İstek hazırlanırken hata oluştu
            return next(new ErrorResponse('Token doğrulama sırasında hata oluştu', 500));
        }
    }
});

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            console.error('❌ req.user bulunamadı, yetkilendirme yapılamıyor');
            return next(new ErrorResponse('Kullanıcı bilgisi bulunamadı, yetkilendirme yapılamıyor.', 401));
        }
        
        if (!roles.includes(req.user.role)) {
            console.error(`❌ Yetkilendirme başarısız: ${req.user.role} rolü, gerekli roller: ${roles.join(', ')}`);
            return next(new ErrorResponse(
                `'${req.user.role}' rolü bu işlemi yapmak için yetkili değil. Gerekli rol: ${roles.join(', ')}`, 
                403
            ));
        }
        
        console.log('✅ Yetkilendirme başarılı:', {
            userRole: req.user.role,
            requiredRoles: roles
        });
        
        next();
    };
};