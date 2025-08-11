const express = require('express');
const {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/products');

// Gerekli modelleri ve middleware'leri import ediyoruz
const Product = require('../models/Product');
const advancedResults = require('../middleware/advancedResults');
const { authMiddleware } = require('@e-commerce/shared-utils'); 
const { protect, authorize } = authMiddleware;
const upload = require('../middleware/upload'); 
const { updateStock } = require('../controllers/products'); 
const router = express.Router();

//--- ROTALARIN TANIMLANMASI ---

/*
 * @route   GET /api/products
 * @desc    Tüm ürünleri gelişmiş filtreleme ile listeler.
 * @access  Public (Herkes erişebilir)
 *
 * @route   POST /api/products
 * @desc    Yeni bir ürün oluşturur. (Resim yükleme dahil)
 * @access  Private (Sadece 'admin' rolündeki kullanıcılar)
 */
router.route('/')
    .get(advancedResults(Product), getProducts)
    .post(protect, authorize('admin'), upload.array('images', 5), createProduct);

/*
 * @route   GET /api/products/:id
 * @desc    ID'ye göre tek bir ürünü getirir.
 * @access  Public (Herkes erişebilir)
 *
 * @route   PUT /api/products/:id
 * @desc    ID'ye göre bir ürünü günceller.
 * @access  Private (Sadece 'admin' rolündeki kullanıcılar)
 *
 * @route   DELETE /api/products/:id
 * @desc    ID'ye göre bir ürünü siler.
 * @access  Private (Sadece 'admin' rolündeki kullanıcılar)
 */
router.route('/:id')
    .get(getProduct)
    .put(protect, authorize('admin'), upload.array('images', 5), updateProduct)
    .delete(protect, authorize('admin'), deleteProduct);

router.route('/update-stock').put(updateStock);


module.exports = router;