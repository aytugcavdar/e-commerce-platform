const express = require('express');
const { register, login, getMe, forgotPassword, resetPassword } = require('../controllers/auth');
const upload = require('../middlewares/upload');
const { protect } = require('../middlewares/authMiddeleware');

const router = express.Router();

router.post('/register', upload.single('avatar'), register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword); // <-- :resettoken bir URL parametresidir

module.exports = router;