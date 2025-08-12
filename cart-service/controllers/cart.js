const Cart = require('../models/Cart');
const { ErrorResponse, asyncHandler } = require('@e-commerce/shared-utils');
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

    // --- DEĞİŞİKLİK: Product Service'e gitmek yerine lokal cache'i kullan ---
    const product = await ProductCache.findById(productId);

    if (!product) {
        return next(new ErrorResponse(`ID'si ${productId} olan ürün bulunamadı.`, 404));
    }
    
    if (product.stock < quantity) {
        return next(new ErrorResponse('Yetersiz stok.', 400));
    }
    // --------------------------------------------------------------------

    let cart = await Cart.findOne({ userId });
    if (!cart) {
        cart = await Cart.create({ userId });
    }

    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

    if (itemIndex > -1) {
        cart.items[itemIndex].quantity = quantity;
    } else {
        cart.items.push({
            productId,
            name: product.name,
            price: product.price,
            quantity,
            image: product.image
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
    const initialItemCount = cart.items.length;
    cart.items = cart.items.filter(item => item.productId.toString() !== productId);
    
    if (cart.items.length === initialItemCount) {
        return next(new ErrorResponse('Ürün sepette bulunamadı', 404));
    }

    cart.modifiedOn = Date.now();
    await cart.save();

    console.log(`🗑️ Ürün sepetten silindi: ${productId}`);
    res.status(200).json({ success: true, data: cart });
});

// @desc    Sepeti tamamen boşalt
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    await Cart.findOneAndDelete({ userId });
    console.log(`🧹 Sepet temizlendi: ${userId}`);
    res.status(200).json({ success: true, data: {} });
});