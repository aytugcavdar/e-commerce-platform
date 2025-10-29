const express = require('express');
const ShippingController = require('../controllers/shippingController');
const { middleware, validators } = require('@ecommerce/shared-utils');

const { validationMiddleware, authMiddleware } = middleware;

const router = express.Router();

/**
 * @route   GET /api/shipping/:orderId
 * @desc    Get shipment status by Order ID
 * @access  Private (User/Admin)
 */
router.get(
    '/:orderId',
    authMiddleware.verifyToken, // Yetkilendirme gerekli
    // TODO: Sipariş sahibi mi veya Admin mi kontrolü ekle
    validationMiddleware.validateObjectId('orderId'), // Geçerli ID formatı mı?
    ShippingController.getShipmentStatus
);

/**
 * @route   PATCH /api/shipping/:orderId/status
 * @desc    Manually update shipment status (Admin)
 * @access  Private (Admin Only)
 */
router.patch(
    '/:orderId/status',
    authMiddleware.verifyToken, //
    authMiddleware.isAdmin, // Sadece Admin
    validationMiddleware.validateObjectId('orderId'), //
    // TODO: Body için Joi validator ekle (status enum, notes string vb.)
    ShippingController.updateShipmentStatus
);


module.exports = router;