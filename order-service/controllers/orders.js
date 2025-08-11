const Order = require('../models/Order');
const { ErrorResponse, asyncHandler } = require('@e-commerce/shared-utils');
const axios = require('axios');
const amqp = require('amqplib'); 

/**
 * RabbitMQ kuyruğuna mesaj yayınlamak için yardımcı fonksiyon.
 * @param {string} queueName - Mesajın gönderileceği kuyruğun adı.
 * @param {object} data - Gönderilecek veri (JSON formatında).
 */
const publishToQueue = async (queueName, data) => {
    try {
        // RabbitMQ sunucusuna bağlan
        const connection = await amqp.connect(process.env.AMQP_URL || 'amqp://guest:guest@localhost');
        const channel = await connection.createChannel();

        // Mesajların kaybolmaması için kuyruğun 'durable' olduğundan emin ol
        await channel.assertQueue(queueName, { durable: true });

        // Mesajı buffer formatında ve 'persistent' olarak kuyruğa gönder
        channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)), { persistent: true });
        
        console.log(`Mesaj "${queueName}" kuyruğuna gönderildi.`.blue);

        // Bağlantıyı kısa bir süre sonra kapat
        setTimeout(() => {
            connection.close();
        }, 500);
    } catch (error) {
        // Hata durumunda sadece konsola log bas, ana işlemi durdurma
        console.error("RabbitMQ'ya mesaj gönderilemedi:", error);
    }
};

/**
 * @desc    Yeni bir sipariş oluşturur.
 * @route   POST /api/orders
 * @access  Private
 */
exports.createOrder = asyncHandler(async (req, res, next) => {
    const { shippingAddress, paymentMethod } = req.body;
    const userId = req.user.id;
    const userToken = req.cookies.token;

    // 1. ADIM: Cart Service'ten kullanıcının sepetini al (Bu işlem senkron kalmalı)
    let cart;
    try {
         const { data } = await axios.get('http://localhost:5005/', {
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
    const order = new Order({
        userId: userId,
        orderItems: cart.items,
        shippingAddress: shippingAddress,
        paymentMethod: paymentMethod,
        itemsPrice: cart.totalPrice,
        taxPrice: 0,
        shippingPrice: 0,
        totalPrice: cart.totalPrice,
    });

    const createdOrder = await order.save();

    // 3. ADIM: "order.created" OLAYINI MESAJ KUYRUĞUNA GÖNDER
    // Bu mesajı diğer servisler (product, notification, cart) dinleyecek.
    const eventData = {
        order: createdOrder,
        user: req.user, // E-posta gibi bilgiler için
        token: userToken // Sepeti temizlemek için
    };
    await publishToQueue('order.created', eventData);

    // Kullanıcıya anında yanıt dön. Stok düşürme, bildirim gönderme gibi işlemler
    // artık arka planda asenkron olarak gerçekleşecek.
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
    
    const orders = await Order.find({}).sort({ createdAt: -1 });
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

    // Sipariş durumu güncellendiğinde de bir olay yayınlayabiliriz.
    const eventData = {
        order: updatedOrder,
        user: { id: order.userId } // Kullanıcı ID'sini gönderiyoruz
    };
    await publishToQueue('order.status.updated', eventData);

    res.status(200).json({ success: true, data: updatedOrder });
});

/**
 * @desc    Siparişi ödenmiş olarak güncelle
 * @route   PUT /api/orders/:id/pay
 * @access  Private
 */
exports.updateOrderToPaid = asyncHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new ErrorResponse(`ID'si ${req.params.id} olan sipariş bulunamadı`, 404));
    }
    
    order.isPaid = true;
    order.paidAt = Date.now();
    order.orderStatus = 'Hazırlanıyor';

    const updatedOrder = await order.save();
    
    res.json({ success: true, data: updatedOrder });
});