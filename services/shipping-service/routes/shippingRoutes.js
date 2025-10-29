const express = require('express');
const ShippingController = require('../controllers/shippingController');
const { middleware, validators } = require('@ecommerce/shared-utils');

// Küçük harfle destructure et
const { validationMiddleware, authMiddleware } = middleware;

const router = express.Router();

/**
 * @route   GET /api/shipping/:orderId
 * @desc    Get shipment status by Order ID
 * @access  Private (User/Admin)
 */
router.get(
  '/:orderId',
  authMiddleware.verifyToken,
  validationMiddleware.validateObjectId('orderId'),
  ShippingController.getShipmentStatus
);

/**
 * @route   PATCH /api/shipping/:orderId/status
 * @desc    Manually update shipment status (Admin)
 * @access  Private (Admin Only)
 */
router.patch(
  '/:orderId/status',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  validationMiddleware.validateObjectId('orderId'),
  ShippingController.updateShipmentStatus
);

module.exports = router;