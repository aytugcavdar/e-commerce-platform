const express = require('express');
const multer = require('multer');
const ProductController = require('../controllers/productController');

const { validators, middleware } = require('@ecommerce/shared-utils');

const { ProductValidators } = validators;
const { 
  ValidationMiddleware, 
  AuthMiddleware,
  RateLimitMiddleware 
} = middleware;

const router = express.Router();

// Multer configuration for product images
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 10 // Maximum 10 images
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
 * @route   GET /api/products
 * @desc    Get all products with filters
 * @access  Public
 * @query   page, limit, sort, search, category, brand, minPrice, maxPrice, inStock, isFeatured, status, tags
 */
router.get('/', ProductController.getAllProducts);

/**
 * @route   GET /api/products/featured
 * @desc    Get featured products
 * @access  Public
 * @query   limit
 */
router.get('/featured', ProductController.getFeaturedProducts);

/**
 * @route   GET /api/products/slug/:slug
 * @desc    Get product by slug
 * @access  Public
 */
router.get('/slug/:slug', ProductController.getProductBySlug);

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get(
  '/:id',
  ValidationMiddleware.validateObjectId('id'),
  ProductController.getProductById
);

/**
 * @route   GET /api/products/:id/related
 * @desc    Get related products
 * @access  Public
 * @query   limit
 */
router.get(
  '/:id/related',
  ValidationMiddleware.validateObjectId('id'),
  ProductController.getRelatedProducts
);

// ===========================================
// PROTECTED ROUTES (Admin only)
// ===========================================

/**
 * @route   POST /api/products
 * @desc    Create new product
 * @access  Private/Admin
 */
router.post(
  '/',
  AuthMiddleware.verifyToken,
  AuthMiddleware.isAdmin,
  RateLimitMiddleware.uploadLimiter,
  upload.array('images', 10), // Max 10 images
  ValidationMiddleware.validateRequest({
    body: ProductValidators.createProductSchema()
  }),
  ProductController.createProduct
);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product
 * @access  Private/Admin
 */
router.put(
  '/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.isAdmin,
  ValidationMiddleware.validateObjectId('id'),
  upload.array('images', 10),
  ValidationMiddleware.validateRequest({
    body: ProductValidators.updateProductSchema()
  }),
  ProductController.updateProduct
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product
 * @access  Private/Admin
 */
router.delete(
  '/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.isAdmin,
  ValidationMiddleware.validateObjectId('id'),
  ProductController.deleteProduct
);

/**
 * @route   DELETE /api/products/:id/images/:imageId
 * @desc    Delete product image
 * @access  Private/Admin
 */
router.delete(
  '/:id/images/:imageId',
  AuthMiddleware.verifyToken,
  AuthMiddleware.isAdmin,
  ValidationMiddleware.validateObjectId('id'),
  ValidationMiddleware.validateObjectId('imageId'),
  ProductController.deleteProductImage
);

/**
 * @route   PATCH /api/products/:id/images/:imageId/main
 * @desc    Set main product image
 * @access  Private/Admin
 */
router.patch(
  '/:id/images/:imageId/main',
  AuthMiddleware.verifyToken,
  AuthMiddleware.isAdmin,
  ValidationMiddleware.validateObjectId('id'),
  ValidationMiddleware.validateObjectId('imageId'),
  ProductController.setMainImage
);

/**
 * @route   PATCH /api/products/:id/stock
 * @desc    Update product stock
 * @access  Private/Admin
 */
router.patch(
  '/:id/stock',
  AuthMiddleware.verifyToken,
  AuthMiddleware.isAdmin,
  ValidationMiddleware.validateObjectId('id'),
  ValidationMiddleware.validateRequest({
    body: ProductValidators.updateStockSchema()
  }),
  ProductController.updateStock
);

module.exports = router;