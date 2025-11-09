// services/user-service/routes/userRoutes.js
const express = require('express');
const UserController = require('../controllers/userController');
const { middleware } = require('@ecommerce/shared-utils');
const { AuthMiddleware } = middleware;

const router = express.Router();

// Sadece 'admin' rolündeki kullanıcıların bu rotalara erişebilmesi için koruma ekle
// (AuthMiddleware'in içinde 'isAdmin' gibi bir kontrolünüz olduğunu varsayıyorum)
// Eğer yoksa, şimdilik sadece 'verifyToken' kullanın.

// GET /api/users/admin/all
router.get(
  '/admin/all',
  AuthMiddleware.verifyToken,
  // AuthMiddleware.isAdmin, // <-- Güvenlik için bu şart!
  UserController.getAllUsers
);

// PATCH /api/users/admin/toggle-block/:userId
router.patch(
  '/admin/toggle-block/:userId',
  AuthMiddleware.verifyToken,
  // AuthMiddleware.isAdmin, // <-- Güvenlik için bu şart!
  UserController.toggleBlockStatus
);

module.exports = router;