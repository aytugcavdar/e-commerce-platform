const Order = require('../models/Order');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const axios = require('axios');

/**
 * @desc    Yeni bir sipariş oluşturur.
 * @route   POST /api/orders
 * @access  Private
 */
exports.createOrder = asyncHandler(async (req, res, next) => {
    const { shippingAddress, paymentMethod } = req.body;
    const userId = req.user.id;
    const userToken = req.cookies.token;

    // 1. ADIM: Cart Service'ten kullanıcının sepetini al
    // ----------------------------------------------------
    let cart;
    try {
        const { data } = await axios.get('http://localhost:5005/api/cart', {
            headers: { 'Cookie': `token=${userToken}` }
        });
        cart = data.data;
    } catch (err) {
        return next(new ErrorResponse('Sepet bilgileri alınamadı. Lütfen tekrar deneyin.', 500));
    }

    if (!cart || cart.items.length === 0) {
        return next(new ErrorResponse('Sipariş oluşturmak için sepetinizde ürün olmalıdır.', 400));
    }

    // 2. ADIM: Siparişi veritabanında oluştur
    // ----------------------------------------------------
    const order = new Order({
        userId: userId,
        orderItems: cart.items,
        shippingAddress: shippingAddress,
        paymentMethod: paymentMethod,
        itemsPrice: cart.totalPrice,
        taxPrice: 0,       // Vergiyi daha sonra hesaplayabilirsiniz
        shippingPrice: 0,  // Kargo ücretini daha sonra hesaplayabilirsiniz
        totalPrice: cart.totalPrice,
    });

    const createdOrder = await order.save();

    // 3. ADIM: Product Service'i çağırarak stokları düşür
    // ----------------------------------------------------
    try {
        const orderItemsForStockUpdate = createdOrder.orderItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity
        }));

        await axios.put('http://localhost:5002/api/products/update-stock', {
            items: orderItemsForStockUpdate
        });
        console.log(`SİPARİŞ BİLGİSİ: Sipariş #${createdOrder._id} için stoklar güncellendi.`.blue);
    } catch (err) {
        console.error(`STOK GÜNCELLEME HATASI: Sipariş #${createdOrder._id} için stoklar düşürülemedi.`.red, err.message);
        // Bu durumda siparişi "Başarısız" olarak işaretleyip yöneticiye bildirim gönderebilirsiniz.
    }

    // 4. ADIM: Notification Service'i çağırarak onay e-postası gönder
    // ------------------------------------------------------------------
    try {
        const emailMessage = `Merhaba ${req.user.firstName},\n\n#${createdOrder._id} numaralı siparişiniz başarıyla oluşturulmuştur.\n\nToplam Tutar: ${createdOrder.totalPrice} TL\n\nTeşekkür ederiz!`;
        
        await axios.post('http://localhost:5003/api/notifications/send', {
            to: req.user.email,
            subject: `Siparişiniz Alındı - No: #${createdOrder._id}`,
            text: emailMessage
        });
        console.log(`SİPARİŞ BİLGİSİ: Sipariş #${createdOrder._id} için onay e-postası gönderildi.`.blue);
    } catch (err) {
        console.error(`E-POSTA HATASI: Sipariş #${createdOrder._id} için onay e-postası gönderilemedi.`.red, err.message);
    }

    // 5. ADIM: Cart Service'i çağırarak sepeti temizle
    // --------------------------------------------------
    try {
        await axios.delete('http://localhost:5005/api/cart', {
            headers: { 'Cookie': `token=${userToken}` }
        });
        console.log(`SİPARİŞ BİLGİSİ: Kullanıcı ${userId} için sepet temizlendi.`.blue);
    } catch (err) {
        console.error(`SEPET TEMİZLEME HATASI: Sipariş #${createdOrder._id} sonrası sepet temizlenemedi.`.red, err.message);
    }

    res.status(201).json({ success: true, data: createdOrder });
});

/**
 * @desc    Giriş yapmış kullanıcının tüm siparişlerini getirir.
 * @route   GET /api/orders/myorders
 * @access  Private
 */
exports.getMyOrders = asyncHandler(async (req, res, next) => {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, data: orders });
});

/**
 * @desc    ID'ye göre tek bir siparişi getirir.
 * @route   GET /api/orders/:id
 * @access  Private
 */
exports.getOrderById = asyncHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new ErrorResponse(`ID'si ${req.params.id} olan sipariş bulunamadı`, 404));
    }
    
    // Kullanıcının kendi siparişi veya admin olup olmadığını kontrol et
    if (order.userId.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse('Bu siparişi görüntüleme yetkiniz yok', 403));
    }
    
    res.status(200).json({ success: true, data: order });
});

/**
 * @desc    Tüm siparişleri getirir (Sadece Admin).
 * @route   GET /api/orders
 * @access  Private/Admin
 */
exports.getAllOrders = asyncHandler(async (req, res, next) => {
    const orders = await Order.find({}).populate('userId', 'id name email'); // Kullanıcı bilgilerini de getir
    res.status(200).json({ success: true, count: orders.length, data: orders });
});

/**
 * @desc    Siparişin durumunu günceller (Sadece Admin).
 * @route   PUT /api/orders/:id/status
 * @access  Private/Admin
 */
exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new ErrorResponse(`ID'si ${req.params.id} olan sipariş bulunamadı`, 404));
    }

    order.orderStatus = req.body.status || order.orderStatus;
    
    if (req.body.status === 'Teslim Edildi') {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
    }

    const updatedOrder = await order.save();

    res.status(200).json({ success: true, data: updatedOrder });
});

// @desc    Siparişi ödenmiş olarak güncelle
// @route   PUT /api/orders/:id/pay
// @access  Private
exports.updateOrderToPaid = asyncHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new ErrorResponse(`ID'si ${req.params.id} olan sipariş bulunamadı`, 404));
    }
    
    order.isPaid = true;
    order.paidAt = Date.now();
    order.orderStatus = 'Hazırlanıyor'; // Ödeme sonrası yeni durum
    // Normalde ödeme ağ geçidinden gelen sonuç buraya kaydedilir.
    // order.paymentResult = {
    //     id: req.body.id,
    //     status: req.body.status,
    //     update_time: req.body.update_time,
    //     email_address: req.body.payer.email_address
    // };

    const updatedOrder = await order.save();

    // İsteğe bağlı: Ödeme başarılı olduğuna dair kullanıcıya bir e-posta daha gönderilebilir.
    
    res.json({ success: true, data: updatedOrder });
});