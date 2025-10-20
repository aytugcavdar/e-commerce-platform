const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Döngüsel import'u engelle - logger'ı doğrudan require et
const logger = require('../logger');

let isConfigured = false;

/**
 * Cloudinary ayarlarını .env dosyasından alarak yapılandırır.
 * Bu fonksiyon, servisin ana dosyasında (server.js) dotenv yüklendikten sonra çağrılmalıdır.
 */
const init = () => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true, // Her zaman https linkleri kullan
    });
    isConfigured = true;
    logger.info('Cloudinary has been configured successfully.');
  } catch (error) {
    logger.error('Failed to configure Cloudinary. Make sure CLOUDINARY environment variables are set.', error);
    isConfigured = false;
  }
};

/**
 * Bir dosyayı (buffer olarak) Cloudinary'e yükler.
 * @param {Buffer} fileBuffer Yüklenecek dosyanın buffer'ı.
 * @param {string} folderName Dosyanın Cloudinary'de kaydedileceği klasör.
 * @returns {Promise<object>} Cloudinary'den dönen upload sonucu.
 */
const uploadFromBuffer = (fileBuffer, folderName) => {
  if (!isConfigured) {
    throw new Error('Cloudinary is not initialized. Call init() first.');
  }
  
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: folderName },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

module.exports = {
  init,
  uploadFromBuffer,
};