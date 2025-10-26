const express = require('express');
const multer = require('multer');
const CategoryController = require('../controllers/categoryController');

const { middleware } = require('@ecommerce/shared-utils');

const { 
  ValidationMiddleware, 
  AuthMiddleware,
  RateLimitMiddleware 
} = middleware;

const router = express.Router();

// Multer configuration for category image
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
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Public
 * @query   isActive, isFeatured, parentId, includeChildren, rootOnly
 */
router.get('/', CategoryController.getAllCategories);

/**
 * @route   GET /api/categories/tree
 * @desc    Get category tree (hierarchical structure)
 * @access  Public
 */
router.get('/tree', CategoryController.getCategoryTree);

/**
 * @route   GET /api/categories/slug/:slug
 * @desc    Get category by slug
 * @access  Public
 */
router.get('/slug/:slug', CategoryController.getCategoryBySlug);

/**
 * @route   GET /api/categories/:id
 * @desc    Get category by ID
 * @access  Public
 */
router.get(
  '/:id',
  ValidationMiddleware.validateObjectId('id'),
  CategoryController.getCategoryById
);

// ===========================================
// PROTECTED ROUTES (Admin only)
// ===========================================

/**
 * @route   POST /api/categories
 * @desc    Create new category
 * @access  Private/Admin
 */
router.post(
  '/',
  AuthMiddleware.verifyToken,
  AuthMiddleware.isAdmin,
  RateLimitMiddleware.uploadLimiter,
  upload.single('image'),
  ValidationMiddleware.validateRequest({ body: CategoryValidators.createCategorySchema() }),
  CategoryController.createCategory
);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category
 * @access  Private/Admin
 */
router.put(
  '/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.isAdmin,
  ValidationMiddleware.validateObjectId('id'),
  upload.single('image'),
  ValidationMiddleware.validateRequest({ body: CategoryValidators.updateCategorySchema() }),
  CategoryController.updateCategory
);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category
 * @access  Private/Admin
 */
router.delete(
  '/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.isAdmin,
  ValidationMiddleware.validateObjectId('id'),
  CategoryController.deleteCategory
);

/**
 * @route   PUT /api/categories/order
 * @desc    Update category order
 * @access  Private/Admin
 */
router.put(
  '/order',
  AuthMiddleware.verifyToken,
  AuthMiddleware.isAdmin,
  CategoryController.updateCategoryOrder
);

module.exports = router;