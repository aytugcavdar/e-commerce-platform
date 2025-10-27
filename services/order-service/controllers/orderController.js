const Order = require('../models/Order');
const axios = require('axios');
const {
  middleware: { asyncHandler },
  helpers: { ResponseFormatter },
  constants: { httpStatus, errorMessages },
  logger,
  rabbitmq: { publisher }
} = require('@ecommerce/shared-utils');

class OrderController {
  /**
   * Create new order
   * @route POST /api/orders
   * @access Private
   */
  static createOrder = asyncHandler(async (req, res, next) => {
  const {
    items,
    shippingAddress,
    billingAddress,
    paymentMethod,
    notes,
    couponCode
  } = req.body;

  const userId = req.user.userId;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(httpStatus.BAD_REQUEST).json(
      ResponseFormatter.error(errorMessages.EMPTY_CART || 'Sepet boş olamaz', httpStatus.BAD_REQUEST)
    );
  }

  let enrichedItems = [];
  let subtotal = 0;

  // 1️⃣ Product Service — Ürünleri doğrula ve fiyatları güncel al
  try {
    const productIds = items.map(item => item.product);
    logger.info(`[OrderService] Fetching products: ${productIds}`);

    const productResponse = await axios.post(
      `${process.env.PRODUCT_SERVICE_URL}/api/products/products/bulk`,
      { ids: productIds }
    );

    if (!productResponse.data?.success) {
      throw new Error('Product service success = false');
    }

    const products = productResponse.data.data;

    enrichedItems = items.map(item => {
      const product = products.find(p => p._id.toString() === item.product.toString());
      if (!product) throw new Error(`Product not found: ${item.product}`);

      const currentPrice = product.discountPrice ?? product.price;
      subtotal += currentPrice * item.quantity;

      return {
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        discountPrice: product.discountPrice,
        image: product.images?.[0]?.url || '',
      };
    });

  } catch (error) {
    logger.error('Product validation failed:', error);
    return next(new Error(errorMessages.PRODUCT_NOT_FOUND));
  }

  // 2️⃣ STOk Kontrolü
  try {
    const checkStockResponse = await axios.post(
      `${process.env.PRODUCT_SERVICE_URL}/api/products/products/check-stock`,
      { items: items.map(i => ({ productId: i.product, quantity: i.quantity })) }
    );

    if (!checkStockResponse.data?.data?.allAvailable) {
      return res.status(httpStatus.BAD_REQUEST).json(
        ResponseFormatter.error(errorMessages.INSUFFICIENT_STOCK, httpStatus.BAD_REQUEST)
      );
    }
  } catch (error) {
    logger.error('Stock check failed:', error);
    return next(new Error(errorMessages.SERVICE_UNAVAILABLE + ' (Product Stock Check)'));
  }

  // 3️⃣ Toplam Hesapları
  let discountAmount = 0;
  let couponData = null;

  if (couponCode) {
    logger.warn(`Coupon validation TODO -> code: ${couponCode}`);
  }

  const tax = subtotal * 0.18;
  const shippingCost = subtotal >= 200 ? 0 : 29.90;
  const total = subtotal + tax + shippingCost - discountAmount;

  // 4️⃣ Siparişi DB’ye Kaydet
  const order = new Order({
    user: userId,
    items: enrichedItems,
    subtotal,
    tax,
    shippingCost,
    discount: discountAmount,
    total,
    shippingAddress,
    billingAddress: billingAddress || shippingAddress,
    paymentMethod,
    notes,
    coupon: couponData,
    status: 'pending',
    paymentStatus: 'pending',
    statusHistory: [{ status: 'pending' }]
  });

  try {
    const savedOrder = await order.save();
    logger.info(`Order created: ${savedOrder._id}`);

    // Event Dispatching
    const stockPayload = {
      orderId: savedOrder._id,
      items: savedOrder.items.map(i => ({ productId: i.product, quantity: i.quantity }))
    };

    await publisher.publish('product.stock.decrease', stockPayload);
    logger.info('Event published: product.stock.decrease');

    const paymentPayload = {
      orderId: savedOrder._id,
      userId: savedOrder.user,
      totalAmount: savedOrder.total,
      paymentMethod: savedOrder.paymentMethod
    };

    await publisher.publish('payment.process', paymentPayload);
    logger.info('Event published: payment.process');

    await publisher.publish('notification.order.created', {
      orderId: savedOrder._id,
      userEmail: req.user.email,
      userName: req.user.firstName,
      orderNumber: savedOrder.orderNumber,
      total: savedOrder.total
    });

    logger.info('Event published: notification.order.created');

    await savedOrder.populate('user', 'firstName lastName email');

    return res
      .status(httpStatus.CREATED)
      .json(ResponseFormatter.success(savedOrder, 'Sipariş başarıyla oluşturuldu.'));

  } catch (error) {
    logger.error('Order database save failed:', error);
    return next(error);
  }
});


  /**
   * Get user orders
   * @route GET /api/orders
   * @access Private
   */
  static getUserOrders = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { 
      page = 1, 
      limit = 10, 
      status,
      startDate,
      endDate 
    } = req.query;

    const filter = { user: userId };

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Order.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    res.status(httpStatus.OK).json(
      ResponseFormatter.success(
        {
          orders,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages,
            hasNextPage: Number(page) < totalPages,
            hasPrevPage: Number(page) > 1
          }
        },
        'Siparişler getirildi'
      )
    );
  });

  /**
   * Get order by ID
   * @route GET /api/orders/:id
   * @access Private
   */
  static getOrderById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';

    const order = await Order.findById(id).populate('user', 'firstName lastName email phone');

    if (!order) {
      return res.status(httpStatus.NOT_FOUND).json(
        ResponseFormatter.error(errorMessages.ORDER_NOT_FOUND, httpStatus.NOT_FOUND)
      );
    }

    // Check if user owns the order or is admin
    if (order.user._id.toString() !== userId && !isAdmin) {
      return res.status(httpStatus.FORBIDDEN).json(
        ResponseFormatter.error(errorMessages.FORBIDDEN, httpStatus.FORBIDDEN)
      );
    }

    res.status(httpStatus.OK).json(
      ResponseFormatter.success(order, 'Sipariş detayı getirildi')
    );
  });

  /**
   * Cancel order
   * @route PATCH /api/orders/:id/cancel
   * @access Private
   */
  static cancelOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(httpStatus.NOT_FOUND).json(
        ResponseFormatter.error(errorMessages.ORDER_NOT_FOUND, httpStatus.NOT_FOUND)
      );
    }

    // Check ownership
    if (order.user.toString() !== userId) {
      return res.status(httpStatus.FORBIDDEN).json(
        ResponseFormatter.error(errorMessages.FORBIDDEN, httpStatus.FORBIDDEN)
      );
    }

    // Check if order can be cancelled
    if (!order.canBeCancelled()) {
      return res.status(httpStatus.BAD_REQUEST).json(
        ResponseFormatter.error(errorMessages.CANNOT_CANCEL_ORDER, httpStatus.BAD_REQUEST)
      );
    }

  
    await order.updateStatus('cancelled', reason || 'Müşteri isteğiyle iptal edildi.', userId); // Model metodunu kullanalım ✅

    try {
      const inventoryPayload = {
        orderId: order._id,
        items: order.items.map(item => ({
          productId: item.product,
          quantity: item.quantity
        }))
      };
      await publisher.publish('product.stock.increase', inventoryPayload); // Veya 'product.stock.release'
      logger.info(`Published stock release request for cancelled order ${order.orderNumber}`);
    } catch (publishError) {
      logger.error(`🚨 CRITICAL: Failed to publish stock release event for cancelled order ${order.orderNumber}:`, publishError);
      
    }

   
    
    if (['confirmed', 'processing'].includes(order.status) && order.paymentStatus === 'completed') {
        try {
            await publisher.publish('payment.refund', { orderId: order._id, amount: order.total /*...*/ });
            logger.info(`Published payment refund request for cancelled order ${order.orderNumber}`);
        } catch(publishError) { logger.error(`🚨 CRITICAL: Failed to publish payment refund event for order ${order.orderNumber}:`, publishError); }
    }


   
    try {
       await publisher.publish('notification.order.cancelled', { orderId: order._id, userEmail: req.user.email, orderNumber: order.orderNumber, reason });
       logger.info(`Published order cancelled notification event for order ${order.orderNumber}`);
    } catch(publishError) { logger.warn('Failed to publish order cancelled notification event:', publishError); }


    res.status(httpStatus.OK).json(
      ResponseFormatter.success(order, 'Sipariş başarıyla iptal edildi')
    );
  });

  /**
   * Get all orders (Admin)
   * @route GET /api/orders/admin/all
   * @access Private/Admin
   */
  static getAllOrders = asyncHandler(async (req, res) => {
    const { 
      page = 1, 
      limit = 20, 
      status,
      paymentStatus,
      startDate,
      endDate,
      search
    } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Order.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    res.status(httpStatus.OK).json(
      ResponseFormatter.success(
        {
          orders,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages
          }
        },
        'Tüm siparişler getirildi'
      )
    );
  });

  /**
   * Update order status (Admin)
   * @route PATCH /api/orders/:id/status
   * @access Private/Admin
   */
  static updateOrderStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, note, trackingNumber, carrier } = req.body;
    const adminId = req.user.userId;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(httpStatus.NOT_FOUND).json(
        ResponseFormatter.error(errorMessages.ORDER_NOT_FOUND, httpStatus.NOT_FOUND)
      );
    }

    // Update status
    await order.updateStatus(status, note, adminId);

    // If shipped, update shipping info
    if (status === 'shipped' && (trackingNumber || carrier)) {
      if (trackingNumber) order.shipping.trackingNumber = trackingNumber;
      if (carrier) order.shipping.carrier = carrier;
      await order.save();
    }

    // Publish status update event
    try {
      await publisher.publish('order.status_updated', {
        orderId: order._id,
        status,
        userId: order.user
      });
    } catch (error) {
      logger.warn('Failed to publish order.status_updated event:', error);
    }

    await order.populate('user', 'firstName lastName email');

    res.status(httpStatus.OK).json(
      ResponseFormatter.success(order, 'Sipariş durumu güncellendi')
    );
  });

  /**
   * Get order statistics (Admin)
   * @route GET /api/orders/admin/stats
   * @access Private/Admin
   */
  static getOrderStatistics = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const matchFilter = {};
    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) matchFilter.createdAt.$gte = new Date(startDate);
      if (endDate) matchFilter.createdAt.$lte = new Date(endDate);
    }

    const stats = await Order.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$total' }
        }
      }
    ]);

    const totalOrders = await Order.countDocuments(matchFilter);
    const totalRevenue = stats.reduce((sum, s) => sum + s.totalRevenue, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    res.status(httpStatus.OK).json(
      ResponseFormatter.success(
        {
          totalOrders,
          totalRevenue,
          averageOrderValue,
          statusBreakdown: stats
        },
        'İstatistikler getirildi'
      )
    );
  });
}

module.exports = OrderController;