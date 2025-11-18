require('dotenv').config();
const mongoose = require('mongoose');
const { logger } = require('@ecommerce/shared-utils');
const app = require('../app.js'); // app.js'den uygulamayı al

const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce-user';

// Veritabanı Bağlantısı ve Sunucu Başlatma
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    logger.info('✅ MongoDB Connected');
    app.listen(PORT, () => {
      logger.info(`🚀 User Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });