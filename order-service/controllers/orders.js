const Order = require('../models/Order');
const { ErrorResponse, asyncHandler } = require('@e-commerce/shared-utils');
const axios = require('axios');
const amqp = require('amqplib'); 

/**
 * RabbitMQ'da bir exchange'e mesaj yayınlamak için yardımcı fonksiyon.
 * @param {string} exchangeName - Mesajın yayınlanacağı exchange'in adı.
 * @param {string} routingKey - Yönlendirme anahtarı (fanout için genellikle boş).
 * @param {object} data - Gönderilecek veri (JSON formatında).
 */
const publishToExchange = async (exchangeName, routingKey, data) => {
    try {
        const connection = await amqp.connect(process.env.AMQP_URL || 'amqp://guest:guest@localhost');
        const channel = await connection.createChannel();
        
        // Exchange'in var olduğundan emin ol
        await channel.assertExchange(exchangeName, 'fanout', { durable: false });
        
        // Mesajı exchange'e yayınla
        channel.publish(exchangeName, routingKey, Buffer.from(JSON.stringify(data)));
        
        console.log(`Mesaj "${exchangeName}" exchange'ine gönderildi.`.blue);
        
        setTimeout(() => {
            connection.close();
        }, 500);
    } catch (error) {
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

    // 1. ADIM: Cart Service'ten kullanıcının sepetini al
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

    // 3. ADIM: "order.created" OLAYINI EXCHANGE'E YAYINLA
    const eventData = {
        order: createdOrder,
        user: req.user,
        token: userToken
    };
    await publishToExchange('order_exchange', '', eventData);

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

    // Sipariş durumu güncellendiğinde de bir olay yayınlıyoruz.
    const eventData = {
        order: updatedOrder,
        user: { id: order.userId } 
    };
    // DÜZELTME: Eski fonksiyon yerine yenisini kullanıyoruz.
    await publishToExchange('order_status_updated_exchange', '', eventData);

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