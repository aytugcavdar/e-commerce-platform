const express = require('express');
const { processPayment } = require('../controllers/payments');
const { authMiddleware } = require('@e-commerce/shared-utils'); 
const { protect } = authMiddleware;

const router = express.Router();

// Bu rotanın da mutlaka giriş yapmış bir kullanıcı tarafından tetiklenmesi gerekir.
router.route('/charge').post(protect, processPayment);

module.exports = router;