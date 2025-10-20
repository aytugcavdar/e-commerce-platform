const connection = require('./connection');
const logger = require('../logger');

// Mesajları RabbitMQ'ya göndermek için basit bir class.
class Publisher {
  async publish(queueName, message) {
    try {
      const conn = await connection.connect();
      const channel = await conn.createChannel();
      
      await channel.assertQueue(queueName, { durable: true }); // Kuyruk yoksa oluşturur
      
      channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
        persistent: true // Mesajların RabbitMQ yeniden başlasa bile kaybolmamasını sağlar
      });
      
      logger.info(`Message published to queue: ${queueName}`);
      await channel.close();
    } catch (error) {
      logger.error(`Failed to publish message to queue ${queueName}:`, error);
    }
  }
}

module.exports = new Publisher();