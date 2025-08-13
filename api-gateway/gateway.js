const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = 5000;

// Logger
app.use(morgan('dev'));

// CORS ayarları
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

// Ortak Proxy Ayarları
const commonProxyOptions = {
    changeOrigin: true,
    onProxyReq: (proxyReq, req) => {
        if (req.headers.cookie) {
            proxyReq.setHeader('cookie', req.headers.cookie);
        }
    },
    onError: (err, req) => {
        console.error('Proxy Hatası:', err.message);
        console.error('İstek URL:', req.url);
    }
};

// Auth servis
app.use('/api/auth', createProxyMiddleware({
    ...commonProxyOptions,
    target: 'http://localhost:5001',
    pathRewrite: { '^/api/auth': '/' },
    logLevel: 'debug'
}));

// Users servis
app.use('/api/users', createProxyMiddleware({
    ...commonProxyOptions,
    target: "http://localhost:5001",
    pathRewrite: { "^/api/users": "/users" },
    logLevel: 'debug', 
    onProxyReq: (proxyReq, req, res) => {
        console.log(`🔄 Users Proxy - Original: ${req.originalUrl} -> Target: ${proxyReq.path}`);
        if (req.headers.cookie) {
            proxyReq.setHeader('cookie', req.headers.cookie);
        }
    }
}));

// Products servis
app.use('/api/products', createProxyMiddleware({
    ...commonProxyOptions,
    target: 'http://localhost:5002',
    pathRewrite: { '^/api/products': '/' },
}));

// Notifications servis
app.use('/api/notifications', createProxyMiddleware({
    ...commonProxyOptions,
    target: 'http://localhost:5003',
    pathRewrite: { '^/api/notifications': '/' },
}));

// Categories servis
app.use('/api/categories', createProxyMiddleware({
    ...commonProxyOptions,
    target: 'http://localhost:5004',
    pathRewrite: { '^/api/categories': '/' },
}));

// Cart servis
app.use('/api/cart', createProxyMiddleware({
    ...commonProxyOptions,
    target: 'http://localhost:5005',
    pathRewrite: { '^/api/cart': '/' },
}));

// Orders servis
app.use('/api/orders', createProxyMiddleware({
    ...commonProxyOptions,
    target: 'http://localhost:5006',
    pathRewrite: { '^/api/orders': '/' },
}));

// Payments servis
app.use('/api/payments', createProxyMiddleware({
    ...commonProxyOptions,
    target: 'http://localhost:5007',
    pathRewrite: { '^/api/payments': '/' },
}));

// 404 Handler - Express 5 uyumlu
app.use((req, res) => {
    console.error(`❌ 404 - Bulunamayan rota: ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: `Rota bulunamadı: ${req.originalUrl}`
    });
});

// Sunucu başlat
app.listen(PORT, () => {
    console.log(`✅ API Gateway http://localhost:${PORT} adresinde çalışıyor.`);
});
