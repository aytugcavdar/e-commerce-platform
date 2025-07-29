const express = require('express');
const dotenv = require('dotenv');
const colors = require('colors');
const morgan = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cloudinary = require('cloudinary').v2;

// Güvenlik ve Hata Yönetimi Middleware'leri
const errorHandler = require('./middleware/errorHandler');

// Route dosyaları
const products = require('./routes/products');

// .env dosyasını yükle
dotenv.config({ path: './.env' });

// Veritabanı bağlantısı
mongoose.connect(process.env.MONGO_URI);
console.log(`ProductDB Bağlandı: ${mongoose.connection.host}`.cyan.underline.bold);


// Cloudinary yapılandırması
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// CORS
app.use(cors());

// Geliştirme ortamında loglama
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Rotaları bağlama (Mount routers)
app.use('/api/products', products);

// Hata yakalama middleware'ini en sona ekle
app.use(errorHandler);

const PORT = process.env.PORT || 5002;

const server = app.listen(
    PORT,
    console.log(
        `${process.env.NODE_ENV} modunda çalışan Product Service ${PORT} portunda dinleniyor`.yellow.bold
    )
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Unhandled Rejection Hatası: ${err.message}`.red);
    server.close(() => process.exit(1));
});