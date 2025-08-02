// notification-service/server.js

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const dotenv = require('dotenv');
const cors = require('cors');
const amqp = require('amqplib'); // RabbitMQ
const sendEmail = require('./utils/sendEmail');

dotenv.config({ path: './config/config.env' });

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

app.use(express.json());
app.use(cors());

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

app.post('/api/notifications/send-email', (req, res) => { /* ... e-posta kodu ... */ });
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
                console.log(`[Notification-Service] Sipariş #${order._id} için e-posta gönderme işi alındı.`.cyan);
                try {
                    const emailMessage = `Merhaba ${user.firstName},\n\n#${order._id} numaralı siparişiniz başarıyla oluşturulmuştur.\n\nToplam Tutar: ${order.totalPrice} TL`;
                    await sendEmail({ to: user.email, subject: `Siparişiniz Alındı - No: #${order._id}`, text: emailMessage });
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