const Cart = require('../models/Cart');
const { ErrorResponse, asyncHandler } = require('@e-commerce/shared-utils');
const axios = require('axios');
const ProductCache = require('../models/ProductCache');
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

    let product;

    // 1. ADIM: Önce yerel önbelleği (ProductCache) kontrol et
    product = await ProductCache.findById(productId);
    console.log(`[Cart-Service] Ürün önbellekten arandı: ${productId}`);

    // 2. ADIM: Önbellekte yoksa, Product Service'ten ürünü çek (Cache miss - fallback)
    if (!product) {
        console.log(`[Cart-Service] Önbellekte bulunamadı. Product Service'e istek atılıyor...`);
        try {
            const { data } = await axios.get(`http://localhost:5002/${productId}`);
            if (data.success && data.data) {
                const productData = data.data;
                // Ürünü gelecekteki istekler için önbelleğe kaydet
                await ProductCache.findByIdAndUpdate(
                    productData._id,
                    {
                        name: productData.name,
                        price: productData.price,
                        stock: productData.stock,
                        image: productData.images && productData.images[0] ? productData.images[0].url : null,
                    },
                    { upsert: true, new: true }
                );
                console.log(`[Cart-Service] Ürün önbelleğe eklendi: ${productData.name}`);
                product = productData;
            } else {
                return next(new ErrorResponse(`ID'si ${productId} olan ürün ana serviste bulunamadı.`, 404));
            }
        } catch (err) {
            console.error('[Cart-Service] Product Service ile iletişim hatası:', err.message);
            return next(new ErrorResponse('Ürün bilgileri alınırken bir hata oluştu.', 500));
        }
    } else {
        console.log(`[Cart-Service] Ürün önbellekte bulundu: ${product.name}`);
    }


    // 3. ADIM: Stok kontrolü yap
    if (product.stock < quantity) {
        return next(new ErrorResponse('Yetersiz stok.', 400));
    }

    // 4. ADIM: Sepeti bul veya oluştur
    let cart = await Cart.findOne({ userId });
    if (!cart) {
        cart = await Cart.create({ userId });
    }

    // 5. ADIM: Ürünü sepete ekle veya miktarını güncelle
    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

    if (itemIndex > -1) {
        // Ürün sepette zaten var, miktarını güncelle
        cart.items[itemIndex].quantity = quantity;
    } else {
        // Ürünü sepete yeni ekle
        cart.items.push({
            productId,
            name: product.name,
            price: product.price,
            quantity,
            image: product.image || (product.images && product.images[0] ? product.images[0].url : null)
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
    console.log(`[Cart-Service] Kullanıcı ${req.user} için sepet temizleme işlemi başlatıldı.`);
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
        return res.status(200).json({
            success: true,
            message: 'Sepet zaten boş veya bulunamadı.',
        });
    }

    await cart.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Sepet başarıyla temizlendi.',
    });
});