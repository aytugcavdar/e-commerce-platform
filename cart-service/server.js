const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const colors = require("colors");
const amqp = require("amqplib"); // RabbitMQ

const { errorHandler } = require("@e-commerce/shared-utils");
const cartRoutes = require("./routes/cart");
const Cart = require("./models/Cart");
const ProductCache = require("./models/ProductCache");
dotenv.config({ path: "./.env" });

mongoose.connect(process.env.MONGO_URI);
console.log(
  colors.bold.underline.cyan(`CartDB Bağlandı: ${mongoose.connection.host}`)
);

const app = express();
app.use(express.json());
app.use(cookieParser());


if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/", cartRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 5005;

const server = app.listen(
  PORT,
  console.log(
    `${process.env.NODE_ENV} modunda çalışan Cart Service ${PORT} portunda dinleniyor`
      .yellow.bold
  )
);

// --- RabbitMQ Dinleyicilerini Başlat ---
async function startRabbitMQListeners() {
  try {
    const connection = await amqp.connect(
      process.env.AMQP_URL || "amqp://guest:guest@localhost"
    );
    const channel = await connection.createChannel();

    // --- 1. SİPARİŞ SONRASI SEPET TEMİZLEME (FANOUT EXCHANGE İLE) ---
    const orderExchangeName = 'order_exchange';
    await channel.assertExchange(orderExchangeName, 'fanout', { durable: false });

    // Service'e özel kalıcı bir kuyruk oluştur
    const cartQueueName = 'cart_service_orders';
    const q_order = await channel.assertQueue(cartQueueName, { 
      exclusive: false, 
      durable: true 
    });
    console.log(`[Cart-Service] Kalıcı kuyruk oluşturuldu: ${q_order.queue}`.green);

    channel.bindQueue(q_order.queue, orderExchangeName, '');
    console.log(`[Cart-Service] Kuyruk "${orderExchangeName}" exchange'ine bağlandı.`.green);

    channel.consume(q_order.queue, async (msg) => {
        if (msg.content) {
            try {
                const { user } = JSON.parse(msg.content.toString());
                console.log(
                  `[Cart-Service] Sipariş sonrası ${user.id} ID'li kullanıcının sepetini temizleme işlemi alındı.`
                    .cyan
                );

                await Cart.findOneAndDelete({ userId: user.id });
                console.log(`[Cart-Service] Sepet temizlendi.`.cyan.bold);
                
                // Mesajı başarılı olarak işaretla
                channel.ack(msg);
            } catch (error) {
                console.error('[Cart-Service] Sepet temizleme hatası:', error);
                // Hata durumunda mesajı reddet
                channel.nack(msg, false, false);
            }
        }
    }, { noAck: false }); // Manual acknowledgment kullan

    // --- 2. ÜRÜN CACHE GÜNCELLEME (DOĞRUDAN KUYRUK DİNLEME İLE) ---
    const productCreatedQueue = "product.created";
    const productUpdatedQueue = "product.updated";
    const productDeletedQueue = "product.deleted";

    await channel.assertQueue(productCreatedQueue, { durable: true });
    await channel.assertQueue(productUpdatedQueue, { durable: true });
    await channel.assertQueue(productDeletedQueue, { durable: true });
    console.log("[Cart-Service] Ürün kuyrukları dinleniyor...".green);

    const upsertProduct = async (msg) => {
      if (msg) {
        try {
          const { product } = JSON.parse(msg.content.toString());
          await ProductCache.findByIdAndUpdate(
            product._id,
            {
              name: product.name,
              price: product.price,
              stock: product.stock,
              image:
                product.images && product.images[0]
                  ? product.images[0].url
                  : null,
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
          console.log(
            `[Cart-Service] Product cache güncellendi: ${product.name}`.cyan
          );
          channel.ack(msg);
        } catch (error) {
          console.error('[Cart-Service] Ürün cache güncelleme hatası:', error);
          channel.nack(msg, false, false);
        }
      }
    };

    const deleteProduct = async (msg) => {
      if (msg) {
        try {
          const { productId } = JSON.parse(msg.content.toString());
          await ProductCache.findByIdAndDelete(productId);
          console.log(
            `[Cart-Service] Product cache'den silindi: ${productId}`.cyan
          );
          channel.ack(msg);
        } catch (error) {
          console.error('[Cart-Service] Ürün cache silme hatası:', error);
          channel.nack(msg, false, false);
        }
      }
    };

    channel.consume(productCreatedQueue, upsertProduct, { noAck: false });
    channel.consume(productUpdatedQueue, upsertProduct, { noAck: false });
    channel.consume(productDeletedQueue, deleteProduct, { noAck: false });

  } catch (error) {
    console.error("[Cart-Service] RabbitMQ bağlantı hatası:".red.bold, error);
  }
}

server.on("listening", () => {
  startRabbitMQListeners();
});

process.on("unhandledRejection", (err, promise) => {
  console.log(`Unhandled Rejection Hatası: ${err.message}`.red);
  server.close(() => process.exit(1));
});