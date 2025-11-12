const express = require('express');
const multer = require('multer');
const BrandController = require('../controllers/brandController');
const { middleware, validators } = require('@ecommerce/shared-utils');

const { BrandValidators } = validators;
const { ValidationMiddleware, AuthMiddleware, RateLimitMiddleware } = middleware;

const router = express.Router();

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Sadece resim dosyaları yüklenebilir!'), false);
    }
  },
});

// ============================================
// 🔍 DEBUG: Log when brandRoutes is loaded
// ============================================
console.log('🏷️  brandRoutes.js loaded');

// ============================================
// PUBLIC ROUTES
// ============================================

router.get('/', (req, res, next) => {
  console.log('🏷️  GET /brands called');
  next();
}, BrandController.getAllBrands);

router.get('/slug/:slug', BrandController.getBrandBySlug);

router.get('/:id', 
  ValidationMiddleware.validateObjectId('id'),
  BrandController.getBrandById
);

// ============================================
// PROTECTED ROUTES (Admin only)
// ============================================

router.post('/',
  AuthMiddleware.verifyToken,
  AuthMiddleware.isAdmin,
  RateLimitMiddleware.uploadLimiter,
  upload.single('logo'),
  ValidationMiddleware.validateRequest({ body: BrandValidators.createBrandSchema() }),
  BrandController.createBrand
);

router.put('/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.isAdmin,
  ValidationMiddleware.validateObjectId('id'),
  upload.single('logo'),
  ValidationMiddleware.validateRequest({ body: BrandValidators.updateBrandSchema() }),
  BrandController.updateBrand
);

router.delete('/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.isAdmin,
  ValidationMiddleware.validateObjectId('id'),
  BrandController.deleteBrand
);

module.exports = router;