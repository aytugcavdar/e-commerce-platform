// services/inventory-service/routes/inventoryRoutes.js

const express = require('express');
const InventoryController = require('../controllers/inventoryController');
const { middleware, validators } = require('@ecommerce/shared-utils');

// Gerekli middleware ve validator'ları al
const { validationMiddleware, authMiddleware, rateLimitMiddleware } = middleware;
const { InventoryValidators } = validators; // Az önce oluşturduğumuz validator

const router = express.Router();

// --- Dahili Servis Rotaları (Internal/Private) ---
// Bu rotalar genellikle sadece diğer servisler (örn: Order Service) tarafından çağrılır.
// Gateway üzerinden erişime kapatılabilir veya özel bir yetkilendirme (örn: API Key) eklenebilir.

/**
 * @route   POST /api/inventory/check-bulk
 * @desc    Birden fazla ürünün stoğunu kontrol et
 * @access  Private (Internal Service Call)
 */
router.post(
  '/check-bulk',
  // Belki servisler arası iletişim için ayrı bir rate limit?
  rateLimitMiddleware.generalLimiter, // Şimdilik genel limiti kullanalım
  // Gelen body'yi valide et
  validationMiddleware.validateRequest({ body: InventoryValidators.checkStockBulkSchema() }),
  InventoryController.checkStockBulk
);

// --- Admin Rotaları ---
// Bu rotalar admin paneli tarafından kullanılacak ve admin yetkisi gerektirecek.

/**
 * @route   PATCH /api/inventory/:productId
 * @desc    Bir ürünün stoğunu veya düşük stok eşiğini ayarla
 * @access  Private (Admin Only)
 */
router.patch(
  '/:productId',
  authMiddleware.verifyToken, // Admin giriş yapmış olmalı
  authMiddleware.isAdmin, // Admin rolüne sahip olmalı
  validationMiddleware.validateObjectId('productId'), // URL'deki ID geçerli mi?
  // Gelen body'yi valide et
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
    authMiddleware.verifyToken, // Yetkilendirme (Admin veya belki belirli servisler?)
    authMiddleware.isAdmin, // Şimdilik sadece admin
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
    authMiddleware.isAdmin,
    // Query parametresini valide et
    validationMiddleware.validateRequest({ query: InventoryValidators.getInventoryQuerySchema() }),
    InventoryController.getInventory // Controller bu senaryoyu yönetiyor (çoklu ID)
);


module.exports = router;