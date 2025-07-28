const cloudinary = require('cloudinary').v2;

// Cloudinary yapılandırması
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Cloudinary'ye dosya yükleme işlemi
 * @param {string} filePath - Yüklenecek dosyanın geçici dosya yolu
 * @param {Object} options - Yükleme seçenekleri
 * @param {string} [options.folder='uploads'] - Cloudinary klasörü
 * @param {number} [options.width] - Resim genişliği (varsa)
 * @param {string} [options.crop='scale'] - Kırpma yöntemi
 * @param {Array} [options.allowedFormats=['jpg', 'png', 'jpeg']] - İzin verilen formatlar
 * @returns {Promise} - Yükleme sonucu
 */
const uploadToCloudinary = async (filePath, options = {}) => {
  // Varsayılan seçenekler
  const uploadOptions = {
    folder: options.folder || 'uploads',
    resource_type: 'auto',
    allowed_formats: options.allowedFormats || ['jpg', 'png', 'jpeg']
  };

  // Opsiyonel parametreler
  if (options.width) uploadOptions.width = options.width;
  if (options.crop) uploadOptions.crop = options.crop;
  if (options.height) uploadOptions.height = options.height;
  if (options.quality) uploadOptions.quality = options.quality;

  // Dosyayı yükle
  try {
    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    return result;
  } catch (error) {
    throw new Error(`Cloudinary yükleme hatası: ${error.message}`);
  }
};

/**
 * Cloudinary'den dosya silme işlemi
 * @param {string} publicId - Silinecek dosyanın public_id değeri
 * @param {Object} options - Silme seçenekleri
 * @param {string} [options.resource_type='image'] - Kaynak tipi
 * @returns {Promise} - Silme sonucu
 */
const deleteFromCloudinary = async (publicId, options = {}) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: options.resource_type || 'image'
    });
    return result;
  } catch (error) {
    throw new Error(`Cloudinary silme hatası: ${error.message}`);
  }
};

/**
 * Resim URL'i oluştur (transformasyon ile)
 * @param {string} publicId - Resmin public_id değeri
 * @param {Object} options - Dönüştürme seçenekleri
 * @returns {string} - Dönüştürülmüş resim URL'i
 */
const getImageUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, options);
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
  getImageUrl
};