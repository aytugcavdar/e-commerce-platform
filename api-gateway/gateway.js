const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = 5000;

app.use(morgan('dev'));

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

// Tüm proxy istekleri için ortak seçenekler
const commonProxyOptions = {
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
        if (req.headers.cookie) {
            proxyReq.setHeader('cookie', req.headers.cookie);
        }
    }
};

// Yönlendirme Kuralları
app.use('/api/auth', createProxyMiddleware({
    ...commonProxyOptions,
    target: 'http://localhost:5001',
    pathRewrite: { '^/api/auth': '/' },
}));
app.use('/api/users', createProxyMiddleware({
    ...commonProxyOptions,
    target: "http://auth-service:5001",
    pathRewrite: { "^/api/users": "/users" },
}));

app.use('/api/products', createProxyMiddleware({
    ...commonProxyOptions,
    target: 'http://localhost:5002',
    pathRewrite: { '^/api/products': '/' },
}));

app.use('/api/notifications', createProxyMiddleware({
    ...commonProxyOptions,
    target: 'http://localhost:5003',
    pathRewrite: { '^/api/notifications': '/' },
}));

app.use('/api/categories', createProxyMiddleware({
    ...commonProxyOptions,
    target: 'http://localhost:5004',
    pathRewrite: { '^/api/categories': '/' },
}));

app.use('/api/cart', createProxyMiddleware({
    ...commonProxyOptions,
    target: 'http://localhost:5005',
    pathRewrite: { '^/api/cart': '/' },
}));

app.use('/api/orders', createProxyMiddleware({
    ...commonProxyOptions,
    target: 'http://localhost:5006',
    pathRewrite: { '^/api/orders': '/' },
}));

app.use('/api/payments', createProxyMiddleware({
    ...commonProxyOptions,
    target: 'http://localhost:5007',
    pathRewrite: { '^/api/payments': '/' },
}));

app.listen(PORT, () => {
    console.log(`API Gateway http://localhost:${PORT} adresinde çalışıyor.`);
});