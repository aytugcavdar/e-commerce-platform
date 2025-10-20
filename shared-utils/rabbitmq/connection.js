const amqp = require('amqplib');
const logger = require('../logger');

// RabbitMQ'ya olan bağlantıyı yöneten singleton bir class.
// Bu sayede her seferinde yeni bağlantı açmak yerine mevcut bağlantıyı kullanırız.
class RabbitMQConnection {
  constructor() {
    this.connection = null;
  }

  async connect() {
    if (this.connection) {
      return this.connection;
    }

    try {
      const RABBITMQ_URI = process.env.RABBITMQ_URI || 'amqp://localhost';
      this.connection = await amqp.connect(RABBITMQ_URI);
      
      this.connection.on('error', (err) => {
        logger.error('RabbitMQ connection error:', err);
        this.connection = null;
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed. Reconnecting...');
        this.connection = null;
        // İsteğe bağlı olarak yeniden bağlanma mekanizması eklenebilir.
      });

      logger.info('Successfully connected to RabbitMQ');
      return this.connection;
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }
}

module.exports = new RabbitMQConnection();