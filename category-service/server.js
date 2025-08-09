const express = require('express');
const dotenv = require('dotenv');
const colors = require('colors');
const morgan = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

// Güvenlik ve Hata Yönetimi Middleware'leri
const errorHandler = require('./middleware/errorHandler');

// Route dosyaları
const categories = require('./routes/categories');

// .env dosyasını yükle
dotenv.config({ path: './.env' });

// Veritabanı bağlantısı
mongoose.connect(process.env.MONGO_URI);
console.log(`CategoryDB Bağlandı: ${mongoose.connection.host}`.cyan.underline.bold);

const app = express();




// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());



// Geliştirme ortamında loglama
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Rotaları bağlama (Mount routers)
app.use('/', categories); 

// Hata yakalama middleware'ini en sona ekle
app.use(errorHandler);

const PORT = process.env.PORT || 5004;

const server = app.listen(
    PORT,
    console.log(
        `${process.env.NODE_ENV} modunda çalışan Category Service ${PORT} portunda dinleniyor`.yellow.bold
    )
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Unhandled Rejection Hatası: ${err.message}`.red);
    server.close(() => process.exit(1));
});