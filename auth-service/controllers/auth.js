const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');
const axios = require('axios');

// @desc    Register user
// @route   POST /api/auth/register
exports.register = asyncHandler(async (req, res, next) => {
    const { username, email, password, firstName, lastName } = req.body;

    // Avatar yükleme işlemi
    let avatarData = {
        public_id: null,
        url: null
    };

    if (req.file) {
        try {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'ecommerce_avatars',
                width: 500,
                height: 500,
                crop: 'limit'
            });
            avatarData = {
                public_id: result.public_id,
                url: result.secure_url
            };
        } catch (error) {
            return next(new ErrorResponse('Avatar yüklenemedi, lütfen tekrar deneyin.', 500));
        }
    }

    // Kullanıcıyı oluştur
    const user = await User.create({
        username, 
        email, 
        password, 
        firstName, 
        lastName,
        avatar: avatarData
    });

    // E-posta doğrulama token'ı oluştur
    const verificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verifyemail/${verificationToken}`;
    const message = `Hesabınızı doğrulamak ve üyeliğinizi başlatmak için lütfen bu linke tıklayın: \n\n ${verificationUrl}`;

    try {
        // Notification service'e e-posta gönder
        await axios.post(
            'http://localhost:5003/api/notifications/send',
            {
                to: user.email,
                subject: 'Hesabınızı Doğrulayın',
                text: message
            }
        );

        res.status(201).json({
            success: true,
            message: 'Kayıt başarılı! Lütfen hesabınızı doğrulamak için e-posta adresinizi kontrol edin.',
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    avatar: user.avatar,
                    emailVerified: user.emailVerified
                }
            }
        });

    } catch (err) {
        console.error('Doğrulama e-postası gönderilemedi:', err);
        
        // Avatar silme
        if (avatarData.public_id) {
            await cloudinary.uploader.destroy(avatarData.public_id);
        }
        
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

    // E-posta doğrulama kontrolü
    if (!user.emailVerified) {
        return next(new ErrorResponse('Giriş yapmadan önce lütfen e-posta adresinizi doğrulayın.', 403)); 
    }

    // Son giriş tarihini güncelle
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // Güvenlik uyarısı gönder (background'da)
    try {
        const loginAlertMessage = `Merhaba ${user.firstName}, hesabınıza yeni bir giriş yapıldı. Eğer bu işlemi siz yapmadıysanız lütfen bizimle iletişime geçin.`;
        
        await axios.post(
            'http://localhost:5003/api/notifications/send',
            {
                to: user.email,
                subject: 'Güvenlik Uyarısı: Hesabınıza Giriş Yapıldı',
                text: loginAlertMessage
            }
        );
    } catch (err) {
        console.error(`Güvenlik uyarısı gönderilemedi: ${user.email}`, err.message);
    }

    sendTokenResponse(user, 200, res, 'Giriş başarılı.');
});

// @desc    Verify user's email
// @route   GET /api/auth/verifyemail/:token
exports.verifyEmail = asyncHandler(async (req, res, next) => {
    const emailVerificationToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({ emailVerificationToken });

    if (!user) {
        return next(new ErrorResponse('Geçersiz doğrulama token\'ı', 400));
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, 'E-posta başarıyla doğrulandı. Giriş yapıldı.');
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
exports.getMe = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({ 
        success: true, 
        data: {
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                fullName: user.fullName,
                avatar: user.avatar,
                role: user.role,
                emailVerified: user.emailVerified,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt
            }
        }
    });
});

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
exports.logout = asyncHandler(async (req, res, next) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        message: 'Başarıyla çıkış yapıldı'
    });
});

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
exports.forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return res.status(200).json({ 
            success: true, 
            message: 'E-posta gönderildi' 
        });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/resetpassword/${resetToken}`;
    const message = `Şifrenizi sıfırlamak için lütfen bu linke tıklayın: \n\n ${resetUrl}`;

    try {
        await axios.post(
            'http://localhost:5003/api/notifications/send',
            {
                to: user.email,
                subject: 'Şifre Sıfırlama İsteği',
                text: message
            }
        );

        res.status(200).json({ 
            success: true, 
            message: 'E-posta başarıyla gönderildi.' 
        });

    } catch (err) {
        console.error('E-posta gönderme hatası:', err);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new ErrorResponse('E-posta gönderilemedi, lütfen tekrar deneyin.', 500));
    }
});

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
exports.resetPassword = asyncHandler(async (req, res, next) => {
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resettoken)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
        return next(new ErrorResponse('Geçersiz veya süresi dolmuş token', 400));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, 'Şifre başarıyla güncellendi.');
});

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res, message) => {
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            message: message || 'İşlem başarılı',
            token,
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    fullName: user.fullName,
                    avatar: user.avatar,
                    role: user.role,
                    emailVerified: user.emailVerified
                }
            }
        });
};