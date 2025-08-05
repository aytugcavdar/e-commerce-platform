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
app.use(cors());

// --- Yönlendirme Kuralları ---

// Kullanıcı ve Yetkilendirme Servisi'ne yönlendirme
// /api/auth/* gelen tüm istekler http://localhost:5001'e yönlendirilecek
app.use('/api/auth', createProxyMiddleware({
    target: 'http://localhost:5001',
    changeOrigin: true,
}));

// Ürün Servisi'ne yönlendirme
// /api/products/* gelen tüm istekler http://localhost:5002'ye yönlendirilecek
app.use('/api/products', createProxyMiddleware({
    target: 'http://localhost:5002',
    changeOrigin: true,
}));

// Bildirim Servisi'ne yönlendirme
app.use('/api/notifications', createProxyMiddleware({
    target: 'http://localhost:5003', // Notification Service'in adresi
    changeOrigin: true,
}));

// Kategori Servisi'ne yönlendirme
app.use('/api/categories', createProxyMiddleware({
    target: 'http://localhost:5004', // Category Service için belirleyeceğiniz port
    changeOrigin: true,
}));

app.use('/api/cart', createProxyMiddleware({
    target: 'http://localhost:5005', // Cart Service'in adresi
    changeOrigin: true,
}));

app.use('/api/orders', createProxyMiddleware({
    target: 'http://localhost:5006', // Order Service'in adresi
    changeOrigin: true,
}));

app.use('/api/payments', createProxyMiddleware({
    target: 'http://localhost:5007', // Payment Service'in adresi
    changeOrigin: true,
}));



app.listen(PORT, () => {
    console.log(`API Gateway http://localhost:${PORT} adresinde çalışıyor.`);
});

