const express = require('express');
const {
    getCart,
    addItemToCart,
    removeItemFromCart,
    clearCart
} = require('../controllers/cart');

const { protect } = require('../middleware/authMiddeleware');

const router = express.Router();

// Bu servisteki tüm rotalar giriş yapmış kullanıcılar için olacağından,
// protect middleware'ini en üste bu şekilde ekleyebiliriz.
router.use(protect);

router.route('/')
    .get(getCart)
    .post(addItemToCart)
    .delete(clearCart);

router.route('/:productId')
    .delete(removeItemFromCart);

module.exports = router;