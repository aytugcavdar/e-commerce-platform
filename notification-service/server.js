const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const dotenv = require('dotenv');
const cors = require('cors');
const amqp = require('amqplib'); // RabbitMQ
const sendEmail = require('./utils/sendEmail');
const colors = require('colors');
dotenv.config({ path: './.env' });

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

app.use(express.json());


let onlineUsers = {};

io.on('connection', (socket) => {
    console.log(`Bir kullanıcı bağlandı: ${socket.id}`);
    socket.on('register', (userId) => {
        onlineUsers[userId] = socket.id;
        console.log('Kullanıcı kaydedildi:', onlineUsers);
    });
    socket.on('disconnect', () => {
        for (const userId in onlineUsers) {
            if (onlineUsers[userId] === socket.id) {
                delete onlineUsers[userId];
                break;
            }
        }
        console.log(`Bir kullanıcı ayrıldı: ${socket.id}`);
    });
});

app.post('/api/notifications/send-email', async (req, res) => {
    const { email, subject, message } = req.body;
    try {
        await sendEmail({
            email,
            subject,
            message
        });
        res.status(200).json({ success: true, message: 'E-posta gönderildi' });
    } catch (error) {
        console.error('E-posta gönderme hatası:', error);
        res.status(500).json({ success: false, message: 'E-posta gönderilemedi' });
    }
});
app.post('/api/notifications/send-realtime', (req, res) => { /* ... anlık bildirim kodu ... */ });

const PORT = process.env.PORT || 5003;

server.listen(PORT, () => console.log(`Notification Service (HTTP & WebSocket) http://localhost:${PORT} adresinde çalışıyor.`));

// RabbitMQ Dinleyicisini Başlat
async function startEventListeners() {
    try {
        const connection = await amqp.connect(process.env.AMQP_URL || 'amqp://guest:guest@localhost');
        const channel = await connection.createChannel();
        
        // Sipariş oluşturulduğunda e-posta gönder
        const orderCreatedQueue = 'order.created';
        await channel.assertQueue(orderCreatedQueue, { durable: true });
       channel.consume(orderCreatedQueue, async (msg) => {
    if (msg) {
        const { order, user } = JSON.parse(msg.content.toString());
        try {
            const emailMessage = `Merhaba ${user.firstName},\n\n#${order._id} numaralı siparişiniz başarıyla oluşturulmuştur.\n\nToplam Tutar: ${order.totalPrice} TL`;
            
            // Parametre adlarını düzelt
            await sendEmail({
                email: user.email,
                subject: `Siparişiniz Alındı - No: #${order._id}`,
                message: emailMessage
            });
            console.log(`[Notification-Service] Sipariş e-postası gönderildi.`.cyan.bold);
        } catch (emailError) {
            console.error("E-posta gönderim hatası:", emailError);
        }
        channel.ack(msg);
    }
});

        // Sipariş durumu güncellendiğinde anlık bildirim gönder
        const orderUpdatedQueue = 'order.status.updated';
        await channel.assertQueue(orderUpdatedQueue, { durable: true });
        channel.consume(orderUpdatedQueue, (msg) => {
            if (msg) {
                const { order } = JSON.parse(msg.content.toString());
                const userId = order.userId.toString();
                const socketId = onlineUsers[userId];
                if (socketId) {
                    const message = `#${order._id} numaralı siparişinizin durumu güncellendi: ${order.orderStatus}`;
                    io.to(socketId).emit('notification', { message });
                    console.log(`[Notification-Service] ${userId} ID'li kullanıcıya anlık bildirim gönderildi.`.cyan.bold);
                }
                channel.ack(msg);
            }
        });

        console.log('[Notification-Service] RabbitMQ kuyrukları dinleniyor...'.green);

    } catch (error) {
        console.error("[Notification-Service] RabbitMQ bağlantı hatası:", error);
    }
}

server.on('listening', () => {
    startEventListeners();
});