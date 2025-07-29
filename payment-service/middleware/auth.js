const asyncHandler = require('../utils/asyncHandler'); // Bu dosyanın yolu doğru olmalı
const ErrorResponse = require('../utils/errorResponse');
const axios = require('axios');

exports.protect = asyncHandler(async (req, res, next) => {
    let token;
    if (req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return next(new ErrorResponse('Erişim yetkiniz yok (Token bulunamadı)', 401));
    }

    try {
        // 1. AUTH SERVICE'E GİT VE TOKEN'IN GEÇERLİ OLUP OLMADIĞINI SOR
        const { data } = await axios.get('http://localhost:5001/api/auth/me', {
            headers: { 'Cookie': `token=${token}` } // Token'ı cookie olarak gönder
        });

        // 2. AUTH SERVICE'TEN GELEN KULLANICI BİLGİSİNİ BU SERVİSTEKİ req OBJESİNE ATA
        req.user = data.data; // { id: '...', email: '...', role: 'admin' }
        
        console.log(`İstek yapan kullanıcı: ${req.user.email}, Rol: ${req.user.role}`);
        next();
    } catch (err) {
        return next(new ErrorResponse('Geçersiz token. Erişim yetkiniz yok.', 401));
    }
});

// Bu fonksiyon HER SERVİSTE AYNI KALABİLİR. Çünkü req.user objesi yukarıda ayarlandı.
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) { // Önce req.user var mı diye kontrol edelim
            return next(new ErrorResponse('Kullanıcı bilgisi bulunamadı, yetkilendirme yapılamıyor.', 401));
        }
        if (!roles.includes(req.user.role)) {
            return next(new ErrorResponse(
                `'${req.user.role}' rolü bu işlemi yapmak için yetkili değil`, 403
            ));
        }
        next();
    }
}