require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const {
    logger,
    middleware,
    helpers,
}= require('@ecommerce/shared-utils');

const { ErrorHandler } = middleware;
const { CloudinaryHelper } = helpers;
const authRoutes = require('./routes/authRoutes');

const app = express();

CloudinaryHelper.init();

app.use(cors());
app.use(express.json());

// Auth Routes
app.use('/api/auth', authRoutes);

// Hata yakalama middleware'i
app.use(ErrorHandler.notFound);
app.use(ErrorHandler.handle);

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    // MongoDB'ye bağlan
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('MongoDB connection successful.');

    // Sunucuyu dinlemeye başla
    app.listen(PORT, () => {
      logger.info(`Auth Service is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1); // Bağlantı hatası olursa uygulamayı sonlandır
  }
};

startServer();