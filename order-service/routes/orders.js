const express = require('express');
const {
    createOrder,
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
    updateOrderToPaid 
} = require('../controllers/orders');

const { protect, authorize } = require('../middleware/authMiddeleware');

const router = express.Router();

// Bu servisteki tüm rotalar giriş yapmış kullanıcılar için olacağından,
// protect middleware'ini en üste ekliyoruz.
router.use(protect);

router.route('/')
    .post(createOrder)
    .get(authorize('admin'), getAllOrders); // Sadece adminler tüm siparişleri görebilir

router.route('/myorders').get(getMyOrders);

router.route('/:id').get(getOrderById);

router.route('/:id/status').put(authorize('admin'), updateOrderStatus);

router.route('/:id/pay').put(protect, updateOrderToPaid);

module.exports = router;