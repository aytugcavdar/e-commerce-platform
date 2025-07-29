const express = require('express');
const dotenv = require('dotenv');

const morgan = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const colors = require('colors');

// Güvenlik ve Hata Yönetimi Middleware'leri
const errorHandler = require('./middleware/errorHandler');

// Route dosyaları
const cartRoutes = require('./routes/cart');

// .env dosyasını yükle
dotenv.config({ path: './.env' });

// Veritabanı bağlantısı
mongoose.connect(process.env.MONGO_URI);
console.log(colors.bold.underline.cyan(`CartDB Bağlandı: ${mongoose.connection.host}`));

const app = express();

// Body parser (Gelen JSON verisini okumak için)
app.use(express.json());

// Cookie parser (Gelen cookie'leri okumak için)
app.use(cookieParser());

// CORS (Cross-Origin Resource Sharing)
// Frontend'den gelen istekleri kabul etmek için gereklidir.
app.use(cors());

// Geliştirme ortamında gelen istekleri loglamak için
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Rotaları bağlama (Mount routers)
// /api/cart ile gelen tüm istekleri cartRoutes'a yönlendir.
app.use('/api/cart', cartRoutes);

// Hata yakalama middleware'ini tüm rotalardan sonra, en sona ekle
app.use(errorHandler);

const PORT = process.env.PORT || 5005;

const server = app.listen(
    PORT,
    console.log(
        `${process.env.NODE_ENV} modunda çalışan Cart Service ${PORT} portunda dinleniyor`.yellow.bold
    )
);

// Handle unhandled promise rejections (Yakalanmamış Promise hatalarını yönet)
process.on('unhandledRejection', (err, promise) => {
    console.log(`Unhandled Rejection Hatası: ${err.message}`.red);
    // Hata durumunda sunucuyu düzgün bir şekilde kapat
    server.close(() => process.exit(1));
});