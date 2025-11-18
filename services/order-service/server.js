// services/order-service/server.js

require('dotenv').config();
const mongoose = require('mongoose');
const { logger } = require('@ecommerce/shared-utils');
const app = require('./app'); // app.js'den uygulamayı al

const PORT = process.env.PORT || 5003;
const MONGODB_URI = process.env.MONGODB_URI_ORDER || 'mongodb://localhost:27017/ecommerce-order';

// Veritabanı Bağlantısı ve Sunucu Başlatma
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    logger.info('✅ MongoDB Connected');
    app.listen(PORT, () => {
      logger.info(`🚀 Order Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });