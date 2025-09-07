const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductWithCategory,
  populateCategories
} = require('../controllers/products');

const Product = require('../models/Product');
const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// ÖNEMLİ: Bu sıralama çok kritik!
// Daha spesifik rotalar (:id/with-category gibi) önce gelmelidir

// Genel route'lar
router
  .route('/')
  .get(advancedResults(Product), getProducts)
  .post(protect, authorize('admin'), upload.array('images', 5), createProduct);

// ÖNEMLİ: Bu route mutlaka /:id route'undan ÖNCE tanımlanmalı!
router
  .route('/:id/with-category')
  .get(getProductWithCategory);

// ID bazlı route'lar (en sona)
router
  .route('/:id')
  .get(getProduct)
  .put(protect, authorize('admin'), upload.array('images', 5), updateProduct)
  .delete(protect, authorize('admin'), deleteProduct);


module.exports = router;