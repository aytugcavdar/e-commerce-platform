const express = require('express');
const {
    getUsers,
    getUser,
    updateUser,
    deleteUser,
    updateMe // Kendini güncelleme fonksiyonu
} = require('../controllers/users');
const { authMiddleware } = require('@e-commerce/shared-utils');
const { protect, authorize } = authMiddleware;
const upload = require('../middleware/upload');

const router = express.Router();

// Bu rotadaki tüm işlemler için protect middleware'ini kullan
router.use(protect);

// Admin Rotaları
router.route('/')
    .get(authorize('admin'), getUsers);

router.route('/:id')
    .get(authorize('admin'), getUser)
    .put(authorize('admin'), updateUser)
    .delete(authorize('admin'), deleteUser);

// Kullanıcının kendi profilini güncellemesi için rota
router.put('/updateme', upload.single('avatar'), updateMe);


module.exports = router;