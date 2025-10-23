const express = require('express');
const multer = require('multer');
const AuthController = require('../controllers/authController');

const { validators, middleware } = require('@ecommerce/shared-utils');

const { UserValidators } = validators;
const { ValidationMiddleware, AuthMiddleware } = middleware;

const router = express.Router();

// Multer konfigürasyonu - Avatar upload için
const storage = multer.memoryStorage(); // Cloudinary için hafızada tut
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Sadece resim dosyaları yüklenebilir!'), false);
    }
  },
});

// Kayıt (avatar yükleme ile)
router.post(
  '/register',
  upload.single('avatar'),
  ValidationMiddleware.validateRequest({
    body: UserValidators.registerSchema()
  }),
  AuthController.register
);

// Giriş
router.post(
  '/login',
  ValidationMiddleware.validateRequest({
    body: UserValidators.loginSchema()
  }),
  AuthController.login
);

// Çıkış (korumalı)
router.post(
  '/logout',
  AuthMiddleware.verifyToken,
  AuthController.logout
);

// Token yenileme (korumasız - refresh token cookie'den gelir)
router.post('/refresh-token', AuthController.refreshToken);

// E-posta doğrulama (GET - link tıklanır)
router.get(
  '/verify-email',
  ValidationMiddleware.validateRequest({
    query: UserValidators.verifyEmailSchema()
  }),
  AuthController.verifyEmail
);

// Şifremi unuttum
router.post(
  '/forgot-password',
  ValidationMiddleware.validateRequest({
    body: UserValidators.forgotPasswordSchema()
  }),
  AuthController.forgotPassword
);

// Şifre sıfırlama (GET - link tıklanır, POST - form gönderilir)
router.post(
  '/reset-password',
  ValidationMiddleware.validateRequest({
    query: UserValidators.resetPasswordTokenSchema(),
    body: UserValidators.resetPasswordSchema()
  }),
  AuthController.resetPassword
);

// Doğrulama e-postasını yeniden gönder
router.post(
  '/resend-verification-email',
  ValidationMiddleware.validateRequest({
    body: UserValidators.resendVerificationEmailSchema()
  }),
  AuthController.resendVerificationEmail
);

module.exports = router;
