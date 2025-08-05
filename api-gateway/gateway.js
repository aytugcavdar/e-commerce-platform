// gateway.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const morgan = require('morgan'); // Loglama için

const app = express();
const PORT = 5000;

// Gelen istekleri loglamak için
app.use(morgan('dev'));

// CORS ayarları (Frontend'in erişebilmesi için)
app.use(cors({
    origin: 'http://localhost:5173', // Yalnızca frontend'den gelen isteklere izin ver
    credentials: true                // İsteklerde cookie gibi kimlik bilgilerinin gönderilmesine izin ver
}));

// --- Yönlendirme Kuralları ---

app.use('/api/auth', createProxyMiddleware({
    target: 'http://localhost:5001',
    changeOrigin: true,
    pathRewrite: { '^/api/auth': '/' }, // '/api/auth' -> '/'
}));

app.use('/api/products', createProxyMiddleware({
    target: 'http://localhost:5002',
    changeOrigin: true,
    pathRewrite: { '^/api/products': '/' }, // '/api/products' -> '/'
}));

app.use('/api/notifications', createProxyMiddleware({
    target: 'http://localhost:5003',
    changeOrigin: true,
    pathRewrite: { '^/api/notifications': '/' }, // '/api/notifications' -> '/'
}));

app.use('/api/categories', createProxyMiddleware({
    target: 'http://localhost:5004',
    changeOrigin: true,
    pathRewrite: { '^/api/categories': '/' }, // '/api/categories' -> '/'
}));

app.use('/api/cart', createProxyMiddleware({
    target: 'http://localhost:5005',
    changeOrigin: true,
    pathRewrite: { '^/api/cart': '/' }, // '/api/cart' -> '/'
}));

app.use('/api/orders', createProxyMiddleware({
    target: 'http://localhost:5006',
    changeOrigin: true,
    pathRewrite: { '^/api/orders': '/' }, // '/api/orders' -> '/'
}));

app.use('/api/payments', createProxyMiddleware({
    target: 'http://localhost:5007',
    changeOrigin: true,
    pathRewrite: { '^/api/payments': '/' }, // '/api/payments' -> '/'
}));



app.listen(PORT, () => {
    console.log(`API Gateway http://localhost:${PORT} adresinde çalışıyor.`);
});

