const express = require('express');
const {
    getCategories,
    getCategory,
    getCategoryChildren,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryStats,
    getSubCategories
} = require('../controllers/categories');

// Middleware'leri import et
const { authMiddleware } = require('@e-commerce/shared-utils');
const { protect, authorize } = authMiddleware;
const router = express.Router();

// Public Rotalar (Herkes erişebilir)
router.route('/').get(getCategories);
router.route('/stats').get(getCategoryStats);
router.route('/:id').get(getCategory);
router.route('/:id/children').get(getCategoryChildren);
router.route('/:parentId/subcategories').get(getSubCategories);
// Private/Admin Rotalar (Sadece 'admin' rolündeki kullanıcılar erişebilir)
router.route('/').post(protect, authorize('admin'), createCategory);

router.route('/:id')
    .put(protect, authorize('admin'), updateCategory)
    .delete(protect, authorize('admin'), deleteCategory);

module.exports = router;