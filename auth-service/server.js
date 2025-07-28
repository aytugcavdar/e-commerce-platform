const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = 'morgan';
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./controllers/auth'); 
const cookieParser = require('cookie-parser');

// --- Örnek Route'ları import edelim (kendi dosyalarınızdan alacaksınız) ---
// const authRoutes = require('./routes/auth');

const app = express();

// Çevre değişkenlerini yükle
dotenv.config({ path: './config/config.env' });

// Body parser
app.use(express.json());
app.use(cookieParser()); 

// CORS
app.use(cors());

// --- VERİTABANI BAĞLANTISI ---
// ÖNEMLİ: Bu servis kendi veritabanına bağlanmalı!
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('connected', () => {
    console.log('Auth Service: MongoDB bağlantısı başarılı.');
});

// --- ROUTE'LAR ---
// Örnek: app.use('/api/auth', authRoutes);
// Şimdilik test için basit bir route ekleyelim:
app.get('/api/auth/test', (req, res) => {
    res.status(200).json({ success: true, message: 'Auth Service çalışıyor!' });
});


app.use('/api/auth', authRoutes);



app.use(errorHandler);


// PORT
const PORT = process.env.PORT || 5001; // API Gateway'de belirlediğimiz port






const server = app.listen(PORT, () => {
    console.log(`Auth Service http://localhost:${PORT} adresinde çalışıyor.`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Hata: ${err.message}`);
    server.close(() => process.exit(1));
});