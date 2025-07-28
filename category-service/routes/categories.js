const express = require('express');
const {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/categories');

// Middleware'leri import et
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public Rotalar (Herkes erişebilir)
router.route('/')
    .get(getCategories);

router.route('/:id')
    .get(getCategory);

// Private/Admin Rotalar (Sadece 'admin' rolündeki kullanıcılar erişebilir)
// protect: Giriş yapılmış olmasını kontrol eder.
// authorize('admin'): Kullanıcı rolünün 'admin' olmasını kontrol eder.
router.route('/')
    .post(protect, authorize('admin'), createCategory);

router.route('/:id')
    .put(protect, authorize('admin'), updateCategory)
    .delete(protect, authorize('admin'), deleteCategory);

module.exports = router;