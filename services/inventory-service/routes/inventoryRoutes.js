// services/inventory-service/routes/inventoryRoutes.js

const express = require('express');
const InventoryController = require('../controllers/inventoryController');
const { middleware, validators } = require('@ecommerce/shared-utils');

// Gerekli middleware ve validator'ları al
const { validationMiddleware, authMiddleware, rateLimitMiddleware } = middleware;
// Az önce oluşturduğumuz validator
const { InventoryValidators } = validators; // Bu ismin validators/index.js'teki export ile eşleştiğinden emin ol!

const router = express.Router();

// --- Dahili Servis Rotaları (Internal/Private) ---

/**
 * @route   POST /api/inventory/check-bulk
 * @desc    Birden fazla ürünün stoğunu kontrol et
 * @access  Private (Internal Service Call)
 */
router.post(
  '/check-bulk',
  // Belki servisler arası iletişim için ayrı bir rate limit?
  rateLimitMiddleware.generalLimiter,
  validationMiddleware.validateRequest({ body: InventoryValidators.checkStockBulkSchema() }), // Validator'ı çağırırken () kullan
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
  validationMiddleware.validateObjectId('productId'), // URL'deki ID geçerli mi?
  validationMiddleware.validateRequest({ body: InventoryValidators.adjustStockSchema() }), // Validator'ı çağırırken () kullan
  InventoryController.adjustStock
);

/**
 * @route   GET /api/inventory/:productId
 * @desc    Tek bir ürünün stok bilgisini getir
 * @access  Private (Admin Only or Internal)
 */
router.get(
    '/:productId',
    authMiddleware.verifyToken, // Yetkilendirme
    // authMiddleware.isAdmin, // Belki admin olmayan yetkili servisler de erişebilir? Şimdilik admin kalsın.
    validationMiddleware.validateObjectId('productId'),
    InventoryController.getInventory // Controller bu senaryoyu yönetiyor (tek ID)
);

/**
 * @route   GET /api/inventory?productIds=id1,id2,...
 * @desc    Birden fazla ürünün stok bilgisini getir
 * @access  Private (Admin Only or Internal)
 */
router.get(
    '/', // Base path '/'
    authMiddleware.verifyToken,
    // authMiddleware.isAdmin,
    validationMiddleware.validateRequest({ query: InventoryValidators.getInventoryQuerySchema() }), // Validator'ı çağırırken () kullan
    InventoryController.getInventory // Controller bu senaryoyu yönetiyor (çoklu ID)
);


module.exports = router;