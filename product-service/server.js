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
    const queueName = 'product_service_order_created'; 
    const routingKey = 'order.created';

    await channel.assertExchange(exchangeName, 'direct', { durable: true });
    await channel.assertQueue(queueName, { durable: true });
    await channel.bindQueue(queueName, exchangeName, routingKey);

    console.log(`[Product-Service] "${queueName}" kuyruğu dinleniyor.`.green);

    channel.consume(queueName, async (msg) => {
      console.log('[Product-Service] "order.created" mesajı alındı.');
      console.log('Mesaj içeriği:', msg.content.toString());
      console.log('Mesaj objesi:', msg);
        if (msg !== null) {
          try {
            const order = JSON.parse(msg.content.toString());
            console.log('[Product-Service] Yeni sipariş alındı:', JSON.stringify(order, null, 2));

            for (const product of order.products) {
              console.log(`[Product-Service] Stok güncelleniyor: Ürün ID = ${product._id}, Adet = ${product.quantity}`);
              
                const updatedProduct = await Product.findByIdAndUpdate(
                product._id,
                console.log(`[Product-Service] "${product._id}" ID'li ürün güncelleniyor.`),
                console.log(`[Product-Service] Stok azaltılıyor: ${product.quantity}`),
                console.log("product", product),
                { $inc: { stock: -product.quantity } },
                { new: true } // Bu seçenek, güncellenmiş dokümanı döndürür
              );

              if (updatedProduct) {
                console.log(`[Product-Service] Stok başarıyla güncellendi. Yeni stok: ${updatedProduct.stock}`, updatedProduct);
              } else {
                console.error(`[Product-Service] HATA: ${product._id} ID'li ürün veritabanında bulunamadı!`);
              }
            }
            
            console.log('[Product-Service] Tüm stoklar güncellendi.');
            channel.ack(msg);
          } catch (error) {
            console.error('[Product-Service] Stok güncellenirken bir hata oluştu:', error);
            // Hata durumunda mesajı reddetmek yerine loglayıp devam edebilir veya
            // tekrar işlenmesi için nack(msg, false, true) kullanabilirsiniz.
            channel.ack(msg); 
          }
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