const express = require('express');
const multer = require('multer');
const AuthController = require('../controllers/authController');

const { validators, middleware } = require('@ecommerce/shared-utils');


const { UserValidators } = validators;
const { ValidationMiddleware, AuthMiddleware } = middleware;

const router = express.Router();

const storage = multer.memoryStorage(); // Hafızada tut
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Örnek: 5MB limit
  fileFilter: (req, file, cb) => { // Sadece resim dosyalarına izin ver (opsiyonel)
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Sadece resim dosyaları yüklenebilir!'), false);
    }
  },
});

router.post(
  '/register',
  upload.single('avatar'),
  ValidationMiddleware.validateBody(UserValidators.registerSchema),
  AuthController.register
);

router.post(
  '/login',
  ValidationMiddleware.validateBody(UserValidators.loginSchema),
  AuthController.login
);

router.post('/logout', AuthMiddleware.isAuthenticated, AuthController.logout);

router.post('/refresh-token', AuthController.refreshToken);

router.post(
  '/verify-email',
  ValidationMiddleware.validateBody(UserValidators.verifyEmailSchema),
  AuthController.verifyEmail
);

router.post(
  '/forgot-password',
  ValidationMiddleware.validateBody(UserValidators.forgotPasswordSchema),
  AuthController.forgotPassword
);
router.post(
  '/resend-verification-email',
  ValidationMiddleware.validateBody(UserValidators.resendVerificationEmailSchema),
    AuthController.resendVerificationEmail
);

module.exports = router;


    