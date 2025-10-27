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
  static createOrder = asyncHandler(async (req, res) => {
    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      notes,
      coupon
    } = req.body;

    const userId = req.user.userId;

    // Validate items exist and get product details
    if (!items || items.length === 0) {
      return res.status(httpStatus.BAD_REQUEST).json(
        ResponseFormatter.error(errorMessages.EMPTY_CART, httpStatus.BAD_REQUEST)
      );
    }

    // Check stock availability with Inventory Service
    try {
      const inventoryResponse = await axios.post(
        `${process.env.INVENTORY_SERVICE_URL}/api/inventory/check-bulk`,
        { items: items.map(item => ({ 
          productId: item.product, 
          quantity: item.quantity 
        })) }
      );

      if (!inventoryResponse.data.success) {
        return res.status(httpStatus.BAD_REQUEST).json(
          ResponseFormatter.error(errorMessages.INSUFFICIENT_STOCK, httpStatus.BAD_REQUEST)
        );
      }
    } catch (error) {
      logger.error('Inventory check failed:', error);
      return res.status(httpStatus.SERVICE_UNAVAILABLE).json(
        ResponseFormatter.error(errorMessages.SERVICE_UNAVAILABLE, httpStatus.SERVICE_UNAVAILABLE)
      );
    }

    // Get product details from Product Service
    let enrichedItems = [];
    try {
      const productIds = items.map(item => item.product);
      const productResponse = await axios.post(
        `${process.env.PRODUCT_SERVICE_URL}/api/products/bulk`,
        { ids: productIds }
      );

      const products = productResponse.data.data;
      
      enrichedItems = items.map(item => {
        const product = products.find(p => p._id.toString() === item.product.toString());
        
        if (!product) {
          throw new Error(`Product ${item.product} not found`);
        }

        return {
          product: product._id,
          name: product.name,
          quantity: item.quantity,
          price: product.price,
          discountPrice: product.discountPrice,
          image: product.images?.[0]?.url || '',
          brand: product.brand?.name || '',
          category: product.category?.name || ''
        };
      });
    } catch (error) {
      logger.error('Product fetch failed:', error);
      return res.status(httpStatus.BAD_REQUEST).json(
        ResponseFormatter.error(errorMessages.PRODUCT_NOT_FOUND, httpStatus.BAD_REQUEST)
      );
    }

    // Calculate totals
    const subtotal = enrichedItems.reduce((sum, item) => {
      const itemPrice = item.discountPrice || item.price;
      return sum + (itemPrice * item.quantity);
    }, 0);

    let discount = 0;
    if (coupon) {
      // TODO: Validate coupon with Coupon Service
      discount = coupon.discount || 0;
    }

    const tax = subtotal * 0.18; // 18% KDV
    const shippingCost = subtotal > 200 ? 0 : 29.90; // Free shipping over 200 TL
    const total = subtotal + tax + shippingCost - discount;

    // Create order
    const order = new Order({
      user: userId,
      items: enrichedItems,
      subtotal,
      tax,
      shippingCost,
      discount,
      total,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod,
      notes,
      coupon,
      status: 'pending',
      paymentStatus: 'pending'
    });

    try {
      await order.save();

      // Reserve inventory
      try {
        await axios.post(
          `${process.env.INVENTORY_SERVICE_URL}/api/inventory/reserve`,
          { 
            orderId: order._id,
            items: items.map(item => ({ 
              productId: item.product, 
              quantity: item.quantity 
            }))
          }
        );
      } catch (error) {
        logger.error('Inventory reservation failed:', error);
        // Rollback order
        await order.deleteOne();
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
          ResponseFormatter.error('Stok rezervasyonu başarısız', httpStatus.INTERNAL_SERVER_ERROR)
        );
      }

      // Publish order created event
      try {
        await publisher.publish('order.created', {
          orderId: order._id,
          userId: order.user,
          total: order.total,
          items: order.items.map(item => ({
            productId: item.product,
            quantity: item.quantity
          }))
        });
      } catch (error) {
        logger.warn('Failed to publish order.created event:', error);
      }

      // Populate order
      await order.populate('user', 'firstName lastName email');

      res.status(httpStatus.CREATED).json(
        ResponseFormatter.success(order, 'Sipariş başarıyla oluşturuldu')
      );
    } catch (error) {
      logger.error('Order creation failed:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
        ResponseFormatter.error(errorMessages.DATABASE_ERROR, httpStatus.INTERNAL_SERVER_ERROR)
      );
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

    // Cancel order
    order.status = 'cancelled';
    order.cancellationReason = reason;
    order.cancelledAt = new Date();
    order.cancelledBy = userId;

    await order.save();

    // Release inventory
    try {
      await axios.post(
        `${process.env.INVENTORY_SERVICE_URL}/api/inventory/release`,
        { 
          orderId: order._id,
          items: order.items.map(item => ({
            productId: item.product,
            quantity: item.quantity
          }))
        }
      );
    } catch (error) {
      logger.error('Inventory release failed:', error);
    }

    // Publish order cancelled event
    try {
      await publisher.publish('order.cancelled', {
        orderId: order._id,
        userId: order.user,
        reason
      });
    } catch (error) {
      logger.warn('Failed to publish order.cancelled event:', error);
    }

    res.status(httpStatus.OK).json(
      ResponseFormatter.success(order, 'Sipariş iptal edildi')
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