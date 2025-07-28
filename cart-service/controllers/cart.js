const Cart = require('../models/Cart');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const axios = require('axios');

// @desc    Kullanıcının sepetini getir
// @route   GET /api/cart
// @access  Private
exports.getCart = asyncHandler(async (req, res, next) => {
    // req.user.id, protect middleware'i tarafından Auth Service'ten alınarak eklendi.
    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
        // Kullanıcının henüz bir sepeti yoksa, boş bir sepet döndürebiliriz.
        return res.status(200).json({
            success: true,
            data: { items: [], totalPrice: 0 }
        });
    }

    res.status(200).json({ success: true, data: cart });
});

// @desc    Sepete ürün ekle veya adedini güncelle
// @route   POST /api/cart
// @access  Private
exports.addItemToCart = asyncHandler(async (req, res, next) => {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    // --- SERVİSLER ARASI İLETİŞİM ---
    // 1. Product Service'ten ürün bilgilerini iste
    let product;
    try {
        const { data } = await axios.get(`http://localhost:5002/api/products/${productId}`);
        product = data.data;
    } catch (err) {
        return next(new ErrorResponse(`ID'si ${productId} olan ürün bulunamadı veya Product Service'e ulaşılamadı.`, 404));
    }
    // --------------------------------

    // 2. Kullanıcının sepetini bul veya yeni bir sepet oluştur
    let cart = await Cart.findOne({ userId });
    if (!cart) {
        cart = await Cart.create({ userId });
    }

    // 3. Ürünün sepette olup olmadığını kontrol et
    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

    if (itemIndex > -1) {
        // Ürün sepette zaten var, sadece miktarını güncelle
        cart.items[itemIndex].quantity = quantity;
    } else {
        // Ürün sepette yok, yeni bir ürün olarak ekle
        cart.items.push({
            productId,
            name: product.name,
            price: product.price,
            quantity,
            image: product.images[0]?.url // Ürünün ilk resmini al
        });
    }

    cart.modifiedOn = Date.now();
    await cart.save();

    res.status(200).json({ success: true, data: cart });
});

// @desc    Sepetten bir ürünü sil
// @route   DELETE /api/cart/:productId
// @access  Private
exports.removeItemFromCart = asyncHandler(async (req, res, next) => {
    const { productId } = req.params;
    const userId = req.user.id;

    let cart = await Cart.findOne({ userId });

    if (!cart) {
        return next(new ErrorResponse('Sepet bulunamadı', 404));
    }

    // Ürünü sepetten filtreleyerek çıkar
    cart.items = cart.items.filter(item => item.productId.toString() !== productId);

    cart.modifiedOn = Date.now();
    await cart.save();

    res.status(200).json({ success: true, data: cart });
});

// @desc    Sepeti tamamen boşalt
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    await Cart.findOneAndDelete({ userId });
    res.status(200).json({ success: true, data: {} });
});