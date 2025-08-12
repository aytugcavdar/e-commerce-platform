const express = require('express');
const { 
    register, 
    login, 
    logout,
    getMe, 
    forgotPassword, 
    resetPassword,
    verifyEmail 
} = require('../controllers/auth');
const upload = require('../middleware/upload');
const { authMiddleware } = require('@e-commerce/shared-utils');
const { protect } = authMiddleware;

const router = express.Router();

// Public routes
router.post('/register', upload.single('avatar'), register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.get('/verifyemail/:token', verifyEmail);

// Protected routes
router.get('/me', protect, getMe);


module.exports = router;