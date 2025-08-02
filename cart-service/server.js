// cart-service/server.js

const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const colors = require('colors');
const amqp = require('amqplib'); // RabbitMQ

const errorHandler = require('./middleware/errorHandler');
const cartRoutes = require('./routes/cart');
const Cart = require('./models/Cart'); // Kendi modelini import et

dotenv.config({ path: './.env' });

mongoose.connect(process.env.MONGO_URI);
console.log(colors.bold.underline.cyan(`CartDB Bağlandı: ${mongoose.connection.host}`));

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors());

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.use('/api/cart', cartRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 5005;

const server = app.listen(
    PORT,
    console.log(`${process.env.NODE_ENV} modunda çalışan Cart Service ${PORT} portunda dinleniyor`.yellow.bold)
);

// RabbitMQ Dinleyicisini Başlat
async function startOrderCreatedListener() {
    try {
        const connection = await amqp.connect(process.env.AMQP_URL || 'amqp://guest:guest@localhost');
        const channel = await connection.createChannel();
        const queueName = 'order.created';
        
        await channel.assertQueue(queueName, { durable: true });
        console.log(`[Cart-Service] "${queueName}" kuyruğu dinleniyor.`.green);

        channel.consume(queueName, async (msg) => {
            if (msg !== null) {
                const { user } = JSON.parse(msg.content.toString());
                console.log(`[Cart-Service] Sipariş sonrası ${user.id} ID'li kullanıcının sepetini temizleme işlemi alındı.`.cyan);
                
                await Cart.findOneAndDelete({ userId: user.id });
                console.log(`[Cart-Service] Sepet temizlendi.`.cyan.bold);
                
                channel.ack(msg);
            }
        });
    } catch (error) {
        console.error("[Cart-Service] RabbitMQ bağlantı hatası:", error);
    }
}

server.on('listening', () => {
    startOrderCreatedListener();
});

process.on('unhandledRejection', (err, promise) => {
    console.log(`Unhandled Rejection Hatası: ${err.message}`.red);
    server.close(() => process.exit(1));
});