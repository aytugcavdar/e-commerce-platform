const express = require('express');
const dotenv = require('dotenv');
const colors = require('colors');
const morgan = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cloudinary = require('cloudinary').v2;
const amqp = require('amqplib');
const Product = require('./models/Product');


// .env dosyasını yükle
dotenv.config({ path: './.env' });

async function startOrderCreatedListener() {
    try {
        const connection = await amqp.connect(process.env.AMQP_URL || 'amqp://guest:guest@localhost');
        const channel = await connection.createChannel();
        const queueName = 'order.created';

        await channel.assertQueue(queueName, { durable: true });
        console.log(`[Product-Service] "${queueName}" kuyruğu dinleniyor.`.green);

        channel.consume(queueName, async (msg) => {
            if (msg !== null) {
                const { order } = JSON.parse(msg.content.toString());
                console.log(`[Product-Service] Sipariş #${order._id} için stok güncelleme işlemi alındı.`.cyan);

                // Gelen siparişteki ürünler için stok düşürme operasyonlarını hazırla
                const bulkOps = order.orderItems.map(item => ({
                    updateOne: {
                        filter: { _id: item.productId },
                        update: { $inc: { stock: -item.quantity } }
                    }
                }));

                // Eğer güncellenecek ürün varsa, veritabanına tek seferde yaz
                if (bulkOps.length > 0) {
                    await Product.bulkWrite(bulkOps);
                    console.log(`[Product-Service] Stoklar güncellendi.`.cyan.bold);
                }

                channel.ack(msg); // Mesajın başarıyla işlendiğini onayla
            }
        });
    } catch (error) {
        console.error("[Product-Service] RabbitMQ bağlantı hatası:", error);
    }
}


// Güvenlik ve Hata Yönetimi Middleware'leri
const { errorHandler } = require('@e-commerce/shared-utils');

// Route dosyaları
const products = require('./routes/products');



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



// Geliştirme ortamında loglama
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Rotaları bağlama (Mount routers)
app.use('/', products);

// Hata yakalama middleware'ini en sona ekle
app.use(errorHandler);

const PORT = process.env.PORT || 5002;

const server = app.listen(
    PORT,
    console.log(
        `${process.env.NODE_ENV} modunda çalışan Product Service ${PORT} portunda dinleniyor`.yellow.bold
    )
);

server.on('listening', () => {
    startOrderCreatedListener();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Unhandled Rejection Hatası: ${err.message}`.red);
    server.close(() => process.exit(1));
});