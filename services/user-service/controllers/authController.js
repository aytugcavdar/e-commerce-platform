const User = require('../models/User');
const {
  middleware: { asyncHandler },
  helpers: { ResponseFormatter, TokenHelper, CookieHelper, CloudinaryHelper, EmailHelper, PasswordUtils },
  constants: { httpStatus, errorMessages },
  logger,
} = require('@ecommerce/shared-utils');

class AuthController {
  static register = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, phone } = req.body;
    
    // Mevcut kullanıcı kontrolü
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(httpStatus.CONFLICT).json(
        ResponseFormatter.error('Bu e-posta zaten kayıtlı', httpStatus.CONFLICT)
      );
    }

    let avatarUrl;

    // Avatar yükleme
    if (req.file) {
      try {
        const result = await CloudinaryHelper.uploadImage(req.file.path, 'avatars');
        avatarUrl = result.secure_url;
        logger.info('Avatar yüklendi:', avatarUrl);
      } catch (error) {
        logger.error('Avatar yüklenirken hata oluştu:', error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
          ResponseFormatter.error('Avatar yüklenirken hata oluştu', httpStatus.INTERNAL_SERVER_ERROR)
        );
      }
    }

    // Doğrulama tokeni oluştur
    const verificationToken = TokenHelper.createVerificationToken();

    // Kullanıcı oluştur
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      phone,
      avatarUrl,
      emailVerificationToken: verificationToken.hashedToken,
      emailVerificationExpires: verificationToken.expires,
    });

    await user.save();

    // Doğrulama e-postası gönder
    try {
      const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken.rawToken}`;
      const emailTemplate = EmailHelper.getWelcomeEmailTemplate(user, verificationUrl);
      
      await EmailHelper.sendEmail({
        email: user.email,
        subject: '🎉 Hoş Geldiniz! E-postanızı Doğrulayın',
        message: emailTemplate.text,
        html: emailTemplate.html
      });
      
      logger.info('Doğrulama e-postası gönderildi:', user.email);
    } catch (error) {
      logger.error('Doğrulama e-postası gönderilirken hata oluştu:', error);
      // E-posta hatası kullanıcı kaydını engellemez
    }

    res.status(httpStatus.CREATED).json(
      ResponseFormatter.success(
        user.toJSON(),
        'Kayıt başarılı! Hesabınızı aktifleştirmek için lütfen e-posta adresinize gönderilen doğrulama bağlantısına tıklayın.'
      )
    );
  });

  static login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');
    
    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json(
        ResponseFormatter.error('Geçersiz e-posta veya şifre', httpStatus.UNAUTHORIZED)
      );
    }

    // Hesap kilidi kontrolü
    if (user.isLocked) {
      const remainingTime = user.lockUntil 
        ? Math.ceil((user.lockUntil - Date.now()) / 1000 / 60) 
        : 0;
      const lockMessage = remainingTime > 0 
        ? `Hesabınız kilitlendi. ${remainingTime} dakika sonra tekrar deneyin.`
        : 'Hesabınız kilitlendi. Lütfen daha sonra tekrar deneyin.';
      
      return res.status(httpStatus.FORBIDDEN).json(
        ResponseFormatter.error(lockMessage, httpStatus.FORBIDDEN)
      );
    }

    // Şifre kontrolü
    const isPasswordMatch = await PasswordUtils.compare(password, user.password);
    
    if (!isPasswordMatch) {
      await user.handleFailedLogin();
      return res.status(httpStatus.UNAUTHORIZED).json(
        ResponseFormatter.error(errorMessages.INVALID_CREDENTIALS, httpStatus.UNAUTHORIZED)
      );
    }

    // E-posta doğrulama kontrolü
    if (!user.isEmailVerified) {
      return res.status(httpStatus.FORBIDDEN).json(
        ResponseFormatter.error(errorMessages.EMAIL_NOT_VERIFIED, httpStatus.FORBIDDEN, {
          needsEmailVerification: true,
          email: user.email
        })
      );
    }

    // Başarılı giriş
    await user.resetLoginAttempts();

    logger.info(`Kullanıcı giriş yaptı: ${user.email}`);

    // Token oluştur ve cookie'lere ekle
    CookieHelper.sendTokensResponse(res, user);
  });

  static logout = asyncHandler(async (req, res) => {
    CookieHelper.clearAllAuthCookies(res);
    res.status(httpStatus.OK).json(
      ResponseFormatter.success(null, 'Çıkış başarılı')
    );
  });

  static verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.query;
    const { email } = req.body;

    if (!token || !email) {
      return res.status(httpStatus.BAD_REQUEST).json(
        ResponseFormatter.error('Token ve e-posta gerekli', httpStatus.BAD_REQUEST)
      );
    }

    // Token'ı hash'le ve veritabanında ara
    const hashedToken = TokenHelper.hashToken(token);

    const user = await User.findOne({ 
      email,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json(
        ResponseFormatter.error('Geçersiz veya süresi dolmuş doğrulama tokeni', httpStatus.UNAUTHORIZED)
      );
    }

    // E-postayı doğrula
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save({ validateBeforeSave: false });
    
    logger.info(`Kullanıcı e-posta doğrulandı: ${user.email}`);
    
    res.status(httpStatus.OK).json(
      ResponseFormatter.success(
        { verified: true }, 
        'E-posta adresiniz başarıyla doğrulandı! Şimdi giriş yapabilirsiniz.'
      )
    );
  });

  static forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    
    // Güvenlik: Kullanıcı olmasa bile başarılı mesajı ver (enumeration saldırılarını önlemek için)
    if (!user) {
      logger.warn(`Şifre sıfırlama denemesi - kullanıcı bulunamadı: ${email}`);
      return res.status(httpStatus.OK).json(
        ResponseFormatter.success(null, 'Eğer bu e-posta kayıtlıysa, şifre sıfırlama bağlantısı gönderildi.')
      );
    }

    // Şifre sıfırlama tokeni oluştur
    const resetToken = TokenHelper.createPasswordResetToken();
    user.passwordResetToken = resetToken.hashedToken;
    user.passwordResetExpires = resetToken.expires;
    await user.save({ validateBeforeSave: false });

    // Şifre sıfırlama e-postası gönder
    try {
      const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken.rawToken}`;
      const emailTemplate = EmailHelper.getPasswordResetEmailTemplate(user, resetUrl);
      
      await EmailHelper.sendEmail({
        email: user.email,
        subject: 'Şifre Sıfırlama',
        message: emailTemplate.text,
        html: emailTemplate.html
      });
      
      logger.info(`Şifre sıfırlama tokeni oluşturuldu: ${user.email}`);
    } catch (error) {
      logger.error('Şifre sıfırlama e-postası gönderilemedi:', error);
      // E-posta hatası olsa bile kullanıcıya başarılı mesaj dön (güvenlik için)
    }

    res.status(httpStatus.OK).json(
      ResponseFormatter.success(null, 'Eğer bu e-posta kayıtlıysa, şifre sıfırlama bağlantısı gönderildi.')
    );
  });

  static resendVerificationEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json(
        ResponseFormatter.error('Kullanıcı bulunamadı', httpStatus.NOT_FOUND)
      );
    }

    if (user.isEmailVerified) {
      return res.status(httpStatus.OK).json(
        ResponseFormatter.success(null, 'E-posta zaten doğrulanmış')
      );
    }

    // E-posta doğrulama tokeni oluştur
    const verificationToken = TokenHelper.createEmailVerificationToken();
    user.emailVerificationToken = verificationToken.hashedToken;
    user.emailVerificationExpires = verificationToken.expires;
    await user.save({ validateBeforeSave: false });

    // Doğrulama e-postası gönder
    try {
      const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken.rawToken}`;
      const emailTemplate = EmailHelper.getEmailVerificationTemplate(user, verificationUrl);
      
      await EmailHelper.sendEmail({
        email: user.email,
        subject: 'E-posta Doğrulama',
        message: emailTemplate.text,
        html: emailTemplate.html
      });
      
      logger.info(`E-posta doğrulama tokeni yeniden gönderildi: ${user.email}`);
    } catch (error) {
      logger.error('E-posta gönderilemedi:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
        ResponseFormatter.error('E-posta gönderilemedi. Lütfen tekrar deneyin.', httpStatus.INTERNAL_SERVER_ERROR)
      );
    }

    res.status(httpStatus.OK).json(
      ResponseFormatter.success(null, 'E-posta doğrulama bağlantısı gönderildi!')
    );
  });

  static resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.query;
    const { email, password } = req.body;

    if (!token || !email || !password) {
      return res.status(httpStatus.BAD_REQUEST).json(
        ResponseFormatter.error('Token, e-posta ve şifre gerekli', httpStatus.BAD_REQUEST)
      );
    }

    // Token'ı hash'le ve kullanıcıyı bul
    const hashedToken = TokenHelper.hashToken(token);

    const user = await User.findOne({
      email,
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json(
        ResponseFormatter.error('Geçersiz veya süresi dolmuş şifre sıfırlama tokeni', httpStatus.UNAUTHORIZED)
      );
    }

    // Yeni şifreyi kaydet
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    logger.info(`Şifre sıfırlandı: ${user.email}`);

    res.status(httpStatus.OK).json(
      ResponseFormatter.success(null, 'Şifreniz başarıyla sıfırlandı! Şimdi giriş yapabilirsiniz.')
    );
  });
}

module.exports = AuthController;