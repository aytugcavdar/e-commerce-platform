const amqp = require('amqplib');
const logger = require('../logger');

// RabbitMQ'ya olan bağlantıyı yöneten singleton bir class.
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
      logger.info(`Connecting to RabbitMQ: ${RABBITMQ_URI.replace(/:[^:@]+@/, ':****@')}`); // Password gizle
      
      this.connection = await amqp.connect(RABBITMQ_URI);
      
      this.connection.on('error', (err) => {
        logger.error('RabbitMQ connection error:', err);
        this.connection = null;
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed. Reconnecting...');
        this.connection = null;
      });

      logger.info('✅ Successfully connected to RabbitMQ');
      return this.connection;
    } catch (error) {
      logger.error('❌ Failed to connect to RabbitMQ:', error.message);
      throw error;
    }
  }

  // ✅ YENİ: Bağlantıyı kapatma fonksiyonu
  async close() {
    if (this.connection) {
      try {
        await this.connection.close();
        this.connection = null;
        logger.info('RabbitMQ connection closed successfully');
      } catch (error) {
        logger.error('Error closing RabbitMQ connection:', error);
      }
    }
  }

  // ✅ YENİ: Bağlantı durumunu kontrol et
  isConnected() {
    return !!this.connection;
  }
}

module.exports = new RabbitMQConnection();