const express = require('express');
const OrderController = require('../controllers/orderController');

const { validators, middleware } = require('@ecommerce/shared-utils');

const { OrderValidators } = validators;
const { 
  ValidationMiddleware, 
  AuthMiddleware,
  RateLimitMiddleware 
} = middleware;

const router = express.Router();

// ===========================================
// PROTECTED USER ROUTES
// ===========================================

/**
 * @route   POST /api/orders
 * @desc    Create new order
 * @access  Private
 */
router.post(
  '/',
  AuthMiddleware.verifyToken,
  RateLimitMiddleware.generalLimiter,
  ValidationMiddleware.validateRequest({
    body: OrderValidators.createOrderSchema()
  }),
  OrderController.createOrder
);

/**
 * @route   GET /api/orders
 * @desc    Get user's orders
 * @access  Private
 * @query   page, limit, status, startDate, endDate
 */
router.get(
  '/',
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validateRequest({
    query: OrderValidators.orderQuerySchema()
  }),
  OrderController.getUserOrders
);

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID
 * @access  Private
 */
router.get(
  '/:id',
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validateObjectId('id'),
  OrderController.getOrderById
);

/**
 * @route   PATCH /api/orders/:id/cancel
 * @desc    Cancel order
 * @access  Private
 */
router.patch(
  '/:id/cancel',
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validateObjectId('id'),
  ValidationMiddleware.validateRequest({
    body: OrderValidators.cancelOrderSchema()
  }),
  OrderController.cancelOrder
);

// ===========================================
// ADMIN ROUTES
// ===========================================

/**
 * @route   GET /api/orders/admin/all
 * @desc    Get all orders (Admin)
 * @access  Private/Admin
 * @query   page, limit, status, paymentStatus, startDate, endDate, search
 */
router.get(
  '/admin/all',
  AuthMiddleware.verifyToken,
  AuthMiddleware.isAdmin,
  ValidationMiddleware.validateRequest({
    query: OrderValidators.adminOrderQuerySchema()
  }),
  OrderController.getAllOrders
);

/**
 * @route   GET /api/orders/admin/stats
 * @desc    Get order statistics (Admin)
 * @access  Private/Admin
 * @query   startDate, endDate
 */
router.get(
  '/admin/stats',
  //AuthMiddleware.verifyToken,
  //AuthMiddleware.isAdmin,
  OrderController.getOrderStatistics
);

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update order status (Admin)
 * @access  Private/Admin
 */
router.patch(
  '/:id/status',
  AuthMiddleware.verifyToken,
  AuthMiddleware.isAdmin,
  ValidationMiddleware.validateObjectId('id'),
  ValidationMiddleware.validateRequest({
    body: OrderValidators.updateOrderStatusSchema()
  }),
  OrderController.updateOrderStatus
);

module.exports = router;