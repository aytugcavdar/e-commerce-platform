const express = require('express');
const InventoryController = require('../controllers/inventoryController');
const { middleware, validators } = require('@ecommerce/shared-utils');

// Küçük harfle destructure et
const { validationMiddleware, authMiddleware, rateLimitMiddleware } = middleware;
const { InventoryValidators } = validators;

const router = express.Router();

// --- Dahili Servis Rotaları (Internal/Private) ---

/**
 * @route   POST /api/inventory/check-bulk
 * @desc    Birden fazla ürünün stoğunu kontrol et
 * @access  Private (Internal Service Call)
 */
router.post(
  '/check-bulk',
  rateLimitMiddleware.generalLimiter,
  validationMiddleware.validateRequest({ body: InventoryValidators.checkStockBulkSchema() }),
  InventoryController.checkStockBulk
);

// --- Admin Rotaları ---

/**
 * @route   PATCH /api/inventory/:productId
 * @desc    Bir ürünün stoğunu veya düşük stok eşiğini ayarla
 * @access  Private (Admin Only)
 */
router.patch(
  '/:productId',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  validationMiddleware.validateObjectId('productId'),
  validationMiddleware.validateRequest({ body: InventoryValidators.adjustStockSchema() }),
  InventoryController.adjustStock
);

/**
 * @route   GET /api/inventory/:productId
 * @desc    Tek bir ürünün stok bilgisini getir
 * @access  Private (Admin Only or Internal)
 */
router.get(
  '/:productId',
  authMiddleware.verifyToken,
  validationMiddleware.validateObjectId('productId'),
  InventoryController.getInventory
);

/**
 * @route   GET /api/inventory?productIds=id1,id2,...
 * @desc    Birden fazla ürünün stok bilgisini getir
 * @access  Private (Admin Only or Internal)
 */
router.get(
  '/',
  authMiddleware.verifyToken,
  validationMiddleware.validateRequest({ query: InventoryValidators.getInventoryQuerySchema() }),
  InventoryController.getInventory
);

module.exports = router;