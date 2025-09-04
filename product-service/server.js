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

        const exchangeName = 'order_exchange';
        await channel.assertExchange(exchangeName, 'fanout', { durable: false });

        const q = await channel.assertQueue('', { exclusive: true });
        console.log(`[Product-Service] Geçici kuyruk oluşturuldu: ${q.queue}`.green);
        
        channel.bindQueue(q.queue, exchangeName, '');
        console.log(`[Product-Service] Kuyruk "${exchangeName}" exchange'ine bağlandı. Mesajlar bekleniyor...`.green);

        channel.consume(q.queue, async (msg) => {
            if (msg !== null) {
                console.log('[Product-Service] Yeni bir mesaj alındı. Mesaj işleniyor...'.blue);
                let order;

                try {
                    console.log('[Product-Service] Gelen Ham Mesaj:', msg.content.toString());

                    const parsedMessage = JSON.parse(msg.content.toString());
                    order = parsedMessage.order;

                    console.log('[Product-Service] Alınan sipariş detayı:', JSON.stringify(order, null, 2));

                    if (!order || !order.orderItems || order.orderItems.length === 0) {
                        console.error('[Product-Service] HATA: Sipariş veya sipariş ürünleri (orderItems) mesajda bulunamadı!'.red);
                        return; // noAck: true olduğu için mesaj zaten silinecek
                    }

                    console.log(`[Product-Service] ${order.orderItems.length} adet ürün için stok güncelleme işlemi başlatılıyor...`);

                    for (const item of order.orderItems) {
                        console.log(`[Product-Service] Stok güncelleniyor -> Ürün ID: ${item.productId}, Adet: ${item.quantity}`);

                        const updatedProduct = await Product.findByIdAndUpdate(
                            item.productId,
                            { $inc: { stock: -item.quantity } },
                            { new: true, runValidators: true }
                        );

                        if (updatedProduct) {
                            console.log(`[Product-Service] BAŞARILI: ${item.productId} ID'li ürünün stoğu güncellendi. Yeni Stok: ${updatedProduct.stock}`.cyan);
                        } else {
                            console.error(`[Product-Service] HATA: ${item.productId} ID'li ürün veritabanında bulunamadı!`.red);
                        }
                    }

                    console.log('[Product-Service] Tüm stok güncelleme işlemleri tamamlandı.'.green);

                    channel.ack(msg);

                } catch (error) {
                    console.error('-----------------------------------------------------'.red);
                    console.error('[Product-Service] Stok güncellenirken KRİTİK BİR HATA oluştu!'.red.bold);
                    console.error('Hata Mesajı:', error.message);
                    console.error('Hatanın Detayları:', error);
                    if (order) {
                        console.error('Hataya Neden Olan Sipariş:', JSON.stringify(order, null, 2));
                    } else {
                        console.error('Hataya neden olan sipariş bilgisi alınamadı, ham mesaj:', msg.content.toString());
                    }
                    console.error('-----------------------------------------------------'.red);
                }
            }
        }, { noAck: true });
    } catch (error) {
        console.error("[Product-Service] RabbitMQ bağlantısı veya kanal oluşturma hatası:".red.bold, error);
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
    () => {
        console.log(
            `${process.env.NODE_ENV} modunda çalışan Product Service ${PORT} portunda dinleniyor`.yellow.bold
        );
        // RabbitMQ dinleyicisini sunucu başladıktan sonra BİR KEZ çağırın.
        startOrderCreatedListener();
    }
);

server.on('listening', () => {
    startOrderCreatedListener();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Unhandled Rejection Hatası: ${err.message}`.red);
    server.close(() => process.exit(1));
});