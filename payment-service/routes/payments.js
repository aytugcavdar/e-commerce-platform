const express = require('express');
const { processPayment } = require('../controllers/payments');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Bu rotanın da mutlaka giriş yapmış bir kullanıcı tarafından tetiklenmesi gerekir.
router.route('/charge').post(protect, processPayment);

module.exports = router;