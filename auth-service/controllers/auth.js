const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');
const axios = require('axios');


// @desc    Register user
// @route   POST /api/auth/register
// @desc    Register user
// @route   POST /api/auth/register
exports.register = asyncHandler(async (req, res, next) => {
    const { username, email, password, firstName, lastName } = req.body;

    // 1. KULLANICIYI OLUŞTUR (emailVerified varsayılan olarak false)
    const user = await User.create({
        username, email, password, firstName, lastName
    });

    // 2. DOĞRULAMA TOKEN'I OLUŞTUR VE KAYDET
    const verificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // 3. DOĞRULAMA URL'İ OLUŞTUR
    // Bu URL, frontend'de kullanıcının tıklayacağı link olacak.
    // Frontend bu linki alıp, token ile birlikte backend'e istek atacak.
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verifyemail/${verificationToken}`;

    const message = `Hesabınızı doğrulamak ve üyeliğinizi başlatmak için lütfen bu linke tıklayın: \n\n ${verificationUrl}`;

    try {
        // 4. NOTIFICATION SERVICE İLE E-POSTA GÖNDER
        await axios.post(
            'http://localhost:5003/api/notifications/send',
            {
                to: user.email,
                subject: 'Hesabınızı Doğrulayın',
                text: message
            }
        );

        // 5. KULLANICIYA BİLGİLENDİRME MESAJI DÖN
        res.status(201).json({
            success: true,
            data: 'Kayıt başarılı! Lütfen hesabınızı doğrulamak için e-posta adresinizi kontrol edin.'
        });

    } catch (err) {
        console.error('Doğrulama e-postası gönderilemedi:', err);
        // Hata durumunda oluşturulan kullanıcıyı ve token'ı temizlemek önemlidir.
        // Bu, kullanıcının aynı e-posta ile tekrar kayıt olabilmesini sağlar.
        await User.findByIdAndDelete(user._id);

        return next(new ErrorResponse('Kullanıcı kaydı oluşturulamadı, lütfen tekrar deneyin.', 500));
    }
});

// @desc    Login user
// @route   POST /api/auth/login
exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorResponse('Lütfen e-posta ve şifre girin', 400));
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
        return next(new ErrorResponse('Geçersiz kimlik bilgileri', 401));
    }

    // Eğer kullanıcı e-posta doğrulamasını yapmadıysa, hata döndür
    if (!user.emailVerified) {
        return next(new ErrorResponse('Giriş yapmadan önce lütfen e-posta adresinizi doğrulayın.', 403)); 
    }

    // --- BİLDİRİM GÖNDER: GÜVENLİK UYARISI ---
    try {
        // Son giriş tarihini güncelle
        user.lastLogin = Date.now();
        await user.save({ validateBeforeSave: false });

        const loginAlertMessage = `Merhaba ${user.firstName}, hesabınıza yeni bir giriş yapıldı. Eğer bu işlemi siz yapmadıysanız lütfen bizimle iletişime geçin.`;
        
        await axios.post(
            'http://localhost:5003/api/notifications/send', // Notification Service
            {
                to: user.email,
                subject: 'Güvenlik Uyarısı: Hesabınıza Giriş Yapıldı',
                text: loginAlertMessage
            }
        );
        console.log(`Giriş yapan kullanıcıya güvenlik uyarısı gönderildi: ${user.email}`);
    } catch (err) {
        console.error(`Güvenlik uyarısı gönderilemedi: ${user.email}`, err.message);
    }
    // -----------------------------------------

    sendTokenResponse(user, 200, res, 'Giriş başarılı.');
});

// @desc    Verify user's email
// @route   GET /api/auth/verifyemail/:token
exports.verifyEmail = asyncHandler(async (req, res, next) => {
    // URL'den gelen token'ı al ve hash'le
    const emailVerificationToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({ emailVerificationToken });

    if (!user) {
        return next(new ErrorResponse('Geçersiz doğrulama token\'ı', 400));
    }

    // Kullanıcının e-postasını doğrulanmış olarak işaretle
    user.emailVerified = true;
    user.emailVerificationToken = undefined; // Token'ı temizle
    await user.save();

    // E-posta doğrulandıktan sonra kullanıcıya giriş token'ı vererek oturum açmasını sağla.
    sendTokenResponse(user, 200, res, 'E-posta başarıyla doğrulandı. Giriş yapıldı.');
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
exports.getMe = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
});

// Helper function to get token from model and send response
const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken();
    res.status(statusCode).json({ success: true, token });
};
// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
exports.forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        // Güvenlik için kullanıcı bulunamasa bile "bulunamadı" demeyiz.
        return next(new ErrorResponse('E-posta gönderildi', 200));
    }

    // Sıfırlama token'ını al
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false }); // Validator'ları atlayarak kaydet

    // Sıfırlama URL'ini oluştur (Frontend'inizin bu rotayı işlemesi gerekecek)
    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/resetpassword/${resetToken}`;

    const message = `Şifrenizi sıfırlamak için lütfen bu linke tıklayın: \n\n ${resetUrl}`;

    try {
        // --- NOTIFICATION SERVICE'E İSTEK ---
        // Servisler arası iletişim burada gerçekleşiyor.
        await axios.post(
            'http://localhost:5003/api/notifications/send', // Notification Service'in adresi
            {
                to: user.email,
                subject: 'Şifre Sıfırlama İsteği',
                text: message
            }
        );

        res.status(200).json({ success: true, data: 'E-posta başarıyla gönderildi.' });

    } catch (err) {
        console.error('E-posta gönderme hatası:', err);
        // Hata durumunda token'ı temizle ki kullanıcı tekrar deneyebilsin.
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new ErrorResponse('E-posta gönderilemedi, lütfen tekrar deneyin.', 500));
    }
});


// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
exports.resetPassword = asyncHandler(async (req, res, next) => {
    // URL'den gelen token'ı al ve hash'le
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resettoken)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() } // Token süresinin geçmediğini kontrol et
    });

    if (!user) {
        return next(new ErrorResponse('Geçersiz veya süresi dolmuş token', 400));
    }

    // Yeni şifreyi ayarla
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Kullanıcıya yeni bir token ile yanıt ver
    sendTokenResponse(user, 200, res, 'Şifre başarıyla güncellendi.');
});