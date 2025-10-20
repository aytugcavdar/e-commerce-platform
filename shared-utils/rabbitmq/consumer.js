const connection = require('./connection');
const logger = require('../logger');

/**
 * RabbitMQ Consumer Helper Class
 * Tüm servislerde kullanılabilecek genel bir consumer yapısı sağlar
 */
class Consumer {
  constructor() {
    this.consumers = new Map(); // Aktif consumer'ları takip eder
    this.channel = null;
  }

  /**
   * Consumer'ı başlatır ve mesajları dinlemeye başlar
   * @param {string} queueName - Dinlenecek kuyruk adı
   * @param {Function} handler - Mesaj işleme fonksiyonu
   * @param {Object} options - Consumer seçenekleri
   */
  async consume(queueName, handler, options = {}) {
    try {
      const conn = await connection.connect();
      const channel = await conn.createChannel();
      
      const queueOptions = {
        durable: options.durable !== false, // Varsayılan: true
        ...options.queueOptions
      };
      
      await channel.assertQueue(queueName, queueOptions);
      
      // Prefetch ayarı - aynı anda işlenecek mesaj sayısı
      if (options.prefetch) {
        await channel.prefetch(options.prefetch);
      }
      
      logger.info(`[*] Consumer started for queue: ${queueName}`);
      
      channel.consume(queueName, async (msg) => {
        if (msg !== null) {
          try {
            const content = JSON.parse(msg.content.toString());
            
            logger.info(`[✔] Received message from ${queueName}:`, {
              messageId: msg.properties.messageId,
              timestamp: msg.properties.timestamp
            });
            
            // Kullanıcının handler fonksiyonunu çağır
            await handler(content, msg);
            
            // Manuel ack (acknowledgment) - mesaj başarıyla işlendi
            channel.ack(msg);
            
            logger.info(`[✓] Message processed successfully from ${queueName}`);
            
          } catch (error) {
            logger.error(`[✗] Error processing message from ${queueName}:`, error);
            
            // Hata durumunda mesajı reject et
            if (options.requeue !== false) {
              // Mesajı yeniden kuyruğa koy (varsayılan davranış)
              channel.nack(msg, false, true);
              logger.warn(`[↻] Message requeued in ${queueName}`);
            } else {
              // Mesajı reddet ve kuyruğa geri koyma
              channel.nack(msg, false, false);
              logger.warn(`[✗] Message rejected from ${queueName}`);
            }
          }
        }
      }, {
        noAck: false // Manuel acknowledgment kullan
      });
      
      // Consumer'ı kaydet
      this.consumers.set(queueName, { channel, handler });
      
      return channel;
      
    } catch (error) {
      logger.error(`Failed to start consumer for ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Birden fazla consumer'ı aynı anda başlatır
   * @param {Array} consumers - Consumer konfigürasyonları
   * Örnek: [{ queue: 'queue1', handler: fn1 }, { queue: 'queue2', handler: fn2 }]
   */
  async consumeMultiple(consumers) {
    try {
      const promises = consumers.map(config => 
        this.consume(config.queue, config.handler, config.options)
      );
      
      await Promise.all(promises);
      logger.info(`[✓] ${consumers.length} consumers started successfully`);
      
    } catch (error) {
      logger.error('Failed to start multiple consumers:', error);
      throw error;
    }
  }

  /**
   * Belirli bir consumer'ı durdurur
   * @param {string} queueName - Durdurulacak consumer'ın kuyruk adı
   */
  async stopConsumer(queueName) {
    const consumer = this.consumers.get(queueName);
    
    if (consumer && consumer.channel) {
      try {
        await consumer.channel.close();
        this.consumers.delete(queueName);
        logger.info(`[✓] Consumer stopped for queue: ${queueName}`);
      } catch (error) {
        logger.error(`Failed to stop consumer for ${queueName}:`, error);
      }
    }
  }

  /**
   * Tüm consumer'ları durdurur
   */
  async stopAll() {
    const queues = Array.from(this.consumers.keys());
    
    for (const queue of queues) {
      await this.stopConsumer(queue);
    }
    
    logger.info('[✓] All consumers stopped');
  }

  /**
   * Dead Letter Queue (DLQ) ile consumer oluşturur
   * Başarısız mesajları ayrı bir kuyruğa yönlendirir
   * @param {string} queueName - Ana kuyruk adı
   * @param {string} dlqName - Dead letter kuyruk adı
   * @param {Function} handler - Mesaj işleme fonksiyonu
   */
  async consumeWithDLQ(queueName, dlqName, handler, options = {}) {
    try {
      const conn = await connection.connect();
      const channel = await conn.createChannel();
      
      // Dead Letter Queue'yu oluştur
      await channel.assertQueue(dlqName, { durable: true });
      
      // Ana kuyruk - DLQ ile bağlantılı
      await channel.assertQueue(queueName, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': '',
          'x-dead-letter-routing-key': dlqName,
          'x-message-ttl': options.messageTTL || 86400000, // 24 saat varsayılan
        }
      });
      
      logger.info(`[*] Consumer with DLQ started: ${queueName} -> ${dlqName}`);
      
      // Normal consume işlemi
      return await this.consume(queueName, handler, { ...options, requeue: false });
      
    } catch (error) {
      logger.error(`Failed to start consumer with DLQ for ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Retry mekanizması ile consumer
   * @param {string} queueName - Kuyruk adı
   * @param {Function} handler - Mesaj işleme fonksiyonu
   * @param {number} maxRetries - Maksimum deneme sayısı
   */
  async consumeWithRetry(queueName, handler, maxRetries = 3) {
    return await this.consume(queueName, async (content, msg) => {
      let retryCount = msg.properties.headers?.['x-retry-count'] || 0;
      
      try {
        await handler(content, msg);
      } catch (error) {
        retryCount++;
        
        if (retryCount < maxRetries) {
          logger.warn(`[↻] Retry ${retryCount}/${maxRetries} for message in ${queueName}`);
          
          // Mesajı yeniden kuyruğa koy (headers ile retry sayısını güncelle)
          const conn = await connection.connect();
          const channel = await conn.createChannel();
          
          await channel.sendToQueue(queueName, msg.content, {
            persistent: true,
            headers: {
              'x-retry-count': retryCount
            }
          });
          
        } else {
          logger.error(`[✗] Max retries exceeded for message in ${queueName}`);
          throw error; // DLQ'ya gönderilmesi için hata fırlat
        }
      }
    }, { requeue: false });
  }

  /**
   * Aktif consumer sayısını döndürür
   */
  getActiveConsumersCount() {
    return this.consumers.size;
  }

  /**
   * Aktif consumer'ların listesini döndürür
   */
  getActiveConsumers() {
    return Array.from(this.consumers.keys());
  }
}

module.exports = new Consumer();