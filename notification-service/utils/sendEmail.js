const nodemailer = require('nodemailer');

/**
 * E-posta gönderme fonksiyonu
 * @param {Object} options - E-posta seçenekleri
 * @param {string} options.email - Alıcının e-posta adresi
 * @param {string} options.subject - E-posta konusu
 * @param {string} options.message - E-posta içeriği (HTML veya düz metin)
 * @param {Array} [options.attachments] - Ekler (varsa)
 * @returns {Promise} - Gönderim sonucu
 */
const sendEmail = async (options) => {
  // SMTP ayarlarını oluştur
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  // E-posta seçenekleri
  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // Ekler varsa ekle
  if (options.attachments && Array.isArray(options.attachments)) {
    mailOptions.attachments = options.attachments;
  }

  // HTML içerik tercih edilirse
  if (options.html) {
    mailOptions.html = options.html;
    // HTML varsa text'i kaldır - bazı e-posta istemcileri için yedek olarak tutmak istiyorsanız kaldırmayın
    // delete mailOptions.text;
  }

  // E-postayı gönder
  const info = await transporter.sendMail(mailOptions);

  // Geliştirici bilgisi (sadece geliştirme ortamında)
  if (process.env.NODE_ENV === 'development') {
    console.log('E-posta gönderildi: %s', info.messageId);
    
    // Preview URL'i (sadece ethereal.email kullanılıyorsa)
    if (process.env.SMTP_HOST.includes('ethereal.email')) {
      console.log('Önizleme URL: %s', nodemailer.getTestMessageUrl(info));
    }
  }

  return info;
};

module.exports = sendEmail;