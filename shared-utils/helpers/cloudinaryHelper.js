const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const logger = require('../logger');

let isConfigured = false;

const init = () => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    isConfigured = true;
    logger.info('✅ Cloudinary configured successfully');
  } catch (error) {
    logger.error('❌ Cloudinary configuration failed:', error);
    isConfigured = false;
  }
};

const uploadFromBuffer = (fileBuffer, folderName) => {
  if (!isConfigured) {
    throw new Error('Cloudinary not initialized. Call init() first.');
  }
  
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { 
        folder: folderName,
        resource_type: 'auto' // ✅ YENİ - Her tip dosya destekle
      },
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

// ✅ YENİ METODLAR
const deleteFile = async (publicId) => {
  if (!isConfigured) {
    throw new Error('Cloudinary not initialized');
  }
  
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    logger.info(`File deleted: ${publicId}`);
    return result;
  } catch (error) {
    logger.error(`Failed to delete file ${publicId}:`, error);
    throw error;
  }
};

const uploadFromUrl = async (url, folderName) => {
  if (!isConfigured) {
    throw new Error('Cloudinary not initialized');
  }
  
  try {
    const result = await cloudinary.uploader.upload(url, {
      folder: folderName,
      resource_type: 'auto'
    });
    return result;
  } catch (error) {
    logger.error(`Failed to upload from URL:`, error);
    throw error;
  }
};

const optimizeImage = (url, options = {}) => {
  const defaults = {
    width: options.width || 800,
    height: options.height || 600,
    crop: options.crop || 'fill',
    quality: options.quality || 'auto',
    fetch_format: options.format || 'auto'
  };
  
  return cloudinary.url(url, defaults);
};

module.exports = {
  init,
  uploadFromBuffer,
  deleteFile,
  uploadFromUrl,
  optimizeImage,
};

