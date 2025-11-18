// services/user-service/app.js

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { middleware: { ErrorHandler }, helpers: { ResponseFormatter } } = require('@ecommerce/shared-utils');

// Route'ları import et
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes'); 

const app = express();

// Middleware'ler
// NOT: Genellikle API Gateway arkasındaki servislerde CORS ayarı basitleştirilir.
// Bu, testlerin sağlıklı çalışması için yeterlidir.
app.use(cors()); 
app.use(express.json()); // Body parser
app.use(express.urlencoded({ extended: true })); // Form verilerini işleme
app.use(cookieParser()); // Cookie parser

// Health Check (Sağlık Kontrolü) endpoint'i
app.get('/health', (req, res) => {
    res.status(200).json(
      ResponseFormatter.success({ status: 'healthy' }, 'User service is healthy')
    );
});

// Route Tanımları
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Hata Yakalayıcılar (En sonda olmalı)
app.use(ErrorHandler.notFound);
app.use(ErrorHandler.handle);

module.exports = app; // Express uygulamasını dışarıya aktar