// services/order-service/app.js

const express = require('express');
const cors = require('cors'); // ✅ DÜZELTİLDİ: require.use yerine require('cors')
const cookieParser = require('cookie-parser');

const { middleware: { ErrorHandler }, helpers: { ResponseFormatter } } = require('@ecommerce/shared-utils');

const orderRoutes = require('./routes/orderRoutes');

const app = express();

// Middleware'ler
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors()); // CORS'u etkinleştir

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json(
      ResponseFormatter.success({ status: 'healthy' }, 'Order service is healthy')
    );
});

// Route Tanımları
app.use('/api/orders', orderRoutes);

// Hata Yakalayıcılar
app.use(ErrorHandler.notFound);
app.use(ErrorHandler.handle);

module.exports = app;