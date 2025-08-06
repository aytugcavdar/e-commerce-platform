const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const cookieParser = require('cookie-parser');
const colors = require('colors');

// Cloudinary config - Environment variables yüklendikten sonra
const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

console.log('Cloudinary configured:', {
    cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
    api_key: !!process.env.CLOUDINARY_API_KEY,
    api_secret: !!process.env.CLOUDINARY_API_SECRET
});

const app = express();

// Çevre değişkenlerini yükle - EN BAŞTA OLMALI
dotenv.config({ path: './config/config.env' });

// Debug: Environment variables yüklendi mi?
console.log('Environment Debug:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? 'LOADED' : 'MISSING');
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? 'LOADED' : 'MISSING');

// CORS - EN BAŞTA OLMALI
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

// Morgan logging
app.use(morgan('dev'));

// Cookie parser
app.use(cookieParser()); 

// Body parser - JSON middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- VERİTABANI BAĞLANTISI ---
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('connected', () => {
    console.log(colors.bold.underline.cyan(`Auth DB Bağlandı: ${mongoose.connection.host}`));
});

mongoose.connection.on('error', (err) => {
    console.log(colors.bold.red(`MongoDB Bağlantı Hatası: ${err}`));
});

// --- ROUTE'LAR ---
app.get('/test', (req, res) => {
    res.status(200).json({ success: true, message: 'Auth Service çalışıyor!' });
});

// Upload test endpoint
app.post('/upload-test', require('./middleware/upload').single('avatar'), (req, res) => {
    console.log('Upload test - req.file:', req.file);
    console.log('Upload test - req.body:', req.body);
    
    if (req.file) {
        const fs = require('fs');
        const exists = fs.existsSync(req.file.path);
        res.json({
            success: true,
            message: 'Upload test başarılı',
            file: req.file,
            fileExists: exists
        });
    } else {
        res.json({
            success: false,
            message: 'Dosya yüklenmedi',
            body: req.body
        });
    }
});

// Test için basit register
app.post('/register-test', async (req, res) => {
    try {
        console.log('Test register body:', req.body);
        res.json({ success: true, message: 'Test başarılı', data: req.body });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.use('/', authRoutes);

// Error handler en sonda olmalı
app.use(errorHandler);

// PORT
const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
    console.log(colors.bold.green(`Auth Service http://localhost:${PORT} adresinde çalışıyor.`));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Hata: ${err.message}`);
    server.close(() => process.exit(1));
});