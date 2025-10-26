const express = require('express');
const multer = require('multer');
const BrandController = require('../controllers/brandController');

const { middleware } = require('@ecommerce/shared-utils');

const { 
  ValidationMiddleware, 
  AuthMiddleware,
  RateLimitMiddleware 
} = middleware;

const router = express.Router();

// Multer configuration for brand logo
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Sadece resim dosyaları yüklenebilir!'), false);
    }
  },
});

// ===========================================
// PUBLIC ROUTES
// ===========================================

/**
 * @route   GET /api/brands
 * @desc    Get all brands
 * @access  Public
 * @query   isActive, isFeatured, search
 */
router.get('/', BrandController.getAllBrands);

/**
 * @route   GET /api/brands/slug/:slug
 * @desc    Get brand by slug
 * @access  Public
 */
router.get('/slug/:slug', BrandController.getBrandBySlug);

/**
 * @route   GET /api/brands/:id
 * @desc    Get brand by ID
 * @access  Public
 */
router.get(
  '/:id',
  ValidationMiddleware.validateObjectId('id'),
  BrandController.getBrandById
);

// ===========================================
// PROTECTED ROUTES (Admin only)
// ===========================================

/**
 * @route   POST /api/brands
 * @desc    Create new brand
 * @access  Private/Admin
 */
router.post(
  '/',
  AuthMiddleware.verifyToken,
  AuthMiddleware.isAdmin,
  RateLimitMiddleware.uploadLimiter,
  upload.single('logo'),
  ValidationMiddleware.validateRequest({ body: BrandValidators.createBrandSchema() }),
  BrandController.createBrand
);

/**
 * @route   PUT /api/brands/:id
 * @desc    Update brand
 * @access  Private/Admin
 */
router.put(
  '/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.isAdmin,
  ValidationMiddleware.validateObjectId('id'),
  upload.single('logo'),
  ValidationMiddleware.validateRequest({ body: BrandValidators.updateBrandSchema() }),
  BrandController.updateBrand
);

/**
 * @route   DELETE /api/brands/:id
 * @desc    Delete brand
 * @access  Private/Admin
 */
router.delete(
  '/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.isAdmin,
  ValidationMiddleware.validateObjectId('id'),
  BrandController.deleteBrand
);

module.exports = router;