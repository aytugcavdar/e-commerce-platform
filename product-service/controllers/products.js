// product-service/controllers/products.js

const Product = require('../models/Product');
const { ErrorResponse, asyncHandler } = require('@e-commerce/shared-utils');
const cloudinary = require('cloudinary').v2;
const amqp = require('amqplib'); // RabbitMQ kütüphanesini import ediyoruz

/**
 * RabbitMQ kuyruğuna mesaj yayınlamak için yardımcı fonksiyon.
 * @param {string} queueName - Mesajın gönderileceği kuyruğun adı.
 * @param {object} data - Gönderilecek veri (JSON formatında).
 */
const publishToQueue = async (queueName, data) => {
    try {
        const connection = await amqp.connect(process.env.AMQP_URL || 'amqp://guest:guest@localhost');
        const channel = await connection.createChannel();
        await channel.assertQueue(queueName, { durable: true });
        channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)), { persistent: true });
        console.log(`Mesaj "${queueName}" kuyruğuna gönderildi.`.blue);
        setTimeout(() => {
            connection.close();
        }, 500);
    } catch (error) {
        console.error(`[Product-Service] RabbitMQ'ya mesaj gönderilemedi:`, error);
    }
};

// @desc    Tüm ürünleri getir (Filtreleme, Sıralama, Sayfalama ile)
// @route   GET /api/products
// @access  Public
exports.getProducts = asyncHandler(async (req, res, next) => {
    res.status(200).json(res.advancedResults);
});

// @desc    Tek bir ürün getir
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = asyncHandler(async (req, res, next) => {
    console.log(`🔍 Ürün aranıyor: ${req.params.id}`);
    
    // DÜZELTME: populate('category') yerine populate kullanmayalım
    // Çünkü model'de 'category' field'ı yok, 'categoryId' var
    // Ve zaten 'categoryInfo' cache olarak mevcut
    const product = await Product.findById(req.params.id);

    if (!product) {
        console.log(`❌ Ürün bulunamadı: ${req.params.id}`);
        return next(new ErrorResponse(`ID'si ${req.params.id} olan ürün bulunamadı`, 404));
    }

    console.log(`✅ Ürün bulundu: ${product.name}`);
    res.status(200).json({ success: true, data: product });
});

// ALTERNATIF: Eğer category bilgisine ihtiyacınız varsa bu şekilde yapabilirsiniz
exports.getProductWithCategory = asyncHandler(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorResponse(`ID'si ${req.params.id} olan ürün bulunamadı`, 404));
    }

    // Eğer categoryInfo cache'i boş ise, category service'ten çek
    let productWithCategory = product.toObject();
    
    if (!product.categoryInfo || !product.categoryInfo.name) {
        try {
            // Category service'ten kategori bilgilerini çek
            const axios = require('axios');
            const categoryResponse = await axios.get(`http://localhost:5004/${product.categoryId}`, {
                timeout: 3000
            });
            
            if (categoryResponse.data && categoryResponse.data.success) {
                productWithCategory.category = categoryResponse.data.data;
            }
        } catch (error) {
            console.log('Kategori bilgisi alınamadı, cache kullanılıyor:', error.message);
            // Hata durumunda categoryInfo cache'ini kullan
            productWithCategory.category = product.categoryInfo;
        }
    } else {
        // Cache'deki kategori bilgisini kullan
        productWithCategory.category = product.categoryInfo;
    }

    res.status(200).json({ success: true, data: productWithCategory });
});

// @desc    Yeni bir ürün oluştur
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = asyncHandler(async (req, res, next) => {
    req.body.user = req.user.id;
    req.body.categoryId = req.body.category; 

    if (req.files && req.files.length > 0) {
        req.body.images = req.files.map(file => ({
            public_id: file.filename,
            url: file.path
        }));
    }
    if (req.body.attributes && typeof req.body.attributes === 'string') {
        try {
            req.body.attributes = JSON.parse(req.body.attributes);
        } catch (e) {
            return next(new ErrorResponse('Invalid attributes format', 400));
        }
    }

    const product = await Product.create(req.body);

    // YENİ: Ürün oluşturulduğunda "product.created" olayını yayınla
    await publishToQueue('product.created', { product });

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
    
    req.body.categoryId = req.body.category; 
    
    if (req.files && req.files.length > 0) {
        req.body.images = req.files.map(file => ({
            public_id: file.filename,
            url: file.path
        }));
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    // YENİ: Ürün güncellendiğinde "product.updated" olayını yayınla
    await publishToQueue('product.updated', { product: updatedProduct });

    res.status(200).json({ success: true, data: updatedProduct });
});

// @desc    Ürünü sil
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = asyncHandler(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorResponse(`ID'si ${req.params.id} olan ürün bulunamadı`, 404));
    }

    if (product.images && product.images.length > 0) {
        const publicIds = product.images.map(image => image.public_id);
        await cloudinary.api.delete_resources(publicIds);
    }
    
    await product.remove();

    // YENİ: Ürün silindiğinde "product.deleted" olayını yayınla
    await publishToQueue('product.deleted', { productId: req.params.id });

    res.status(200).json({ success: true, data: {} });
});

// @desc    Birden fazla ürünün stoğunu güncelle (Sipariş sonrası için)
// @route   PUT /api/products/update-stock
// @access  Internal (Sadece diğer servisler tarafından çağrılır, genellikle RabbitMQ üzerinden)
exports.updateStock = asyncHandler(async (req, res, next) => {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
        return next(new ErrorResponse('Geçersiz ürün bilgisi', 400));
    }

    const bulkOps = items.map(item => ({
        updateOne: {
            filter: { _id: item.productId },
            update: { $inc: { stock: -item.quantity } }
        }
    }));

    if (bulkOps.length === 0) {
        return res.status(200).json({ success: true, message: 'Güncellenecek ürün yok.' });
    }
    
    await Product.bulkWrite(bulkOps);

    // Not: Stok güncellemesi arama servisini de etkilemeli. Bu yüzden burada da bir olay yayınlayabiliriz.
    const updatedProductIds = items.map(item => item.productId);
    await publishToQueue('product.stock.updated', { productIds: updatedProductIds });

    res.status(200).json({
        success: true,
        message: `${items.length} ürünün stoğu başarıyla güncellendi.`
    });
});