const Product = require('../models/Product');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const cloudinary = require('cloudinary').v2;

// @desc    Tüm ürünleri getir (Filtreleme, Sıralama, Sayfalama ile)
// @route   GET /api/products
// @access  Public
exports.getProducts = asyncHandler(async (req, res, next) => {
    // advancedResults middleware'i işini yaptıktan sonra yanıtı gönderir.
    res.status(200).json(res.advancedResults);
});

// @desc    Tek bir ürün getir
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = asyncHandler(async (req, res, next) => {
    const product = await Product.findById(req.params.id).populate('category', 'name slug');

    if (!product) {
        return next(new ErrorResponse(`ID'si ${req.params.id} olan ürün bulunamadı`, 404));
    }

    res.status(200).json({ success: true, data: product });
});

// @desc    Yeni bir ürün oluştur
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = asyncHandler(async (req, res, next) => {
    // Ürünü oluşturan admin'in ID'sini req.user'dan al
    req.body.user = req.user.id;

    // Resim yükleme işlemi
    if (req.files && req.files.length > 0) {
        req.body.images = req.files.map(file => ({
            public_id: file.filename,
            url: file.path
        }));
    }

    const product = await Product.create(req.body);

    res.status(201).json({
        success: true,
        data: product
    });
});

// @desc    Ürünü güncelle
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = asyncHandler(async (req, res, next) => {
    let product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorResponse(`ID'si ${req.params.id} olan ürün bulunamadı`, 404));
    }
    
    // Resim yükleme işlemi
    if (req.files && req.files.length > 0) {
        req.body.images = req.files.map(file => ({
            public_id: file.filename,
            url: file.path
        }));
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({ success: true, data: product });
});

// @desc    Ürünü sil
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = asyncHandler(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorResponse(`ID'si ${req.params.id} olan ürün bulunamadı`, 404));
    }

    // Cloudinary'den resimleri sil
    if (product.images && product.images.length > 0) {
        const publicIds = product.images.map(image => image.public_id);
        await cloudinary.api.delete_resources(publicIds);
    }
    
    await product.remove();

    res.status(200).json({ success: true, data: {} });
});

// @desc    Birden fazla ürünün stoğunu güncelle (Sipariş sonrası için)
// @route   PUT /api/products/update-stock
// @access  Internal
exports.updateStock = asyncHandler(async (req, res, next) => {
    const { items } = req.body; // items: [{ productId, quantity }]

    if (!items || !Array.isArray(items)) {
        return next(new ErrorResponse('Geçersiz ürün bilgisi', 400));
    }

    const bulkOps = items.map(item => {
        return {
            updateOne: {
                filter: { _id: item.productId },
                // $inc operatörü ile stok adedini azaltıyoruz.
                update: { $inc: { stock: -item.quantity } }
            }
        };
    });

    if (bulkOps.length === 0) {
        return res.status(200).json({ success: true, message: 'Güncellenecek ürün yok.' });
    }

    // `bulkWrite` ile tek bir veritabanı isteğinde tüm stokları güncelle
    await Product.bulkWrite(bulkOps);

    res.status(200).json({
        success: true,
        message: `${items.length} ürünün stoğu başarıyla güncellendi.`
    });
});