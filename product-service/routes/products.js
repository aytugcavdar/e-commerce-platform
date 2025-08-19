const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductWithCategory,
} = require('../controllers/products');

const router = express.Router();



router
  .route('/')
  .get(getProducts)
  .post(createProduct);

router.route('/:id/with-category').get(getProductWithCategory);


router
  .route('/:id')
  .get(getProduct)
  .put(updateProduct)
  .delete(deleteProduct);

module.exports = router;