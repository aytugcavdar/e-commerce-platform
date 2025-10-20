const nodemailer = require('nodemailer');
const logger = require('../logger');

class EmailHelper {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
  }

  /**
   * E-posta servisini yapılandırır
   */
  async configure() {
    if (this.isConfigured) {
      return;
    }

    try {
      // Test için Ethereal Email kullan (geliştirme ortamı)
      if (process.env.NODE_ENV !== 'production') {
        const testAccount = await nodemailer.createTestAccount();
        
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        
        logger.info('📧 Email configured with Ethereal (test mode)');
      } else {
        // Production ortamında gerçek SMTP ayarları
        this.transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT || 587,
          secure: process.env.EMAIL_PORT == 465,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
        
        logger.info('📧 Email configured with custom SMTP');
      }

      // Bağlantıyı test et
      await this.transporter.verify();
      this.isConfigured = true;
      logger.info('✅ Email service verified successfully');

    } catch (error) {
      logger.error('❌ Email configuration failed:', error.message);
      this.isConfigured = false;
      throw error;
    }
  }

  /**
   * E-posta gönderir
   * @param {Object} options - E-posta seçenekleri
   * @param {string} options.email - Alıcı e-posta adresi
   * @param {string} options.subject - E-posta konusu
   * @param {string} options.message - E-posta mesajı (düz metin)
   * @param {string} options.html - E-posta mesajı (HTML)
   */
  async sendEmail(options) {
    try {
      if (!this.isConfigured) {
        await this.configure();
      }

      if (!this.isConfigured) {
        throw new Error('Email service is not configured');
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'Rent-a-Car <noreply@rent-a-car.com>',
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html || options.message?.replace(/\n/g, '<br>'),
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      // Test modunda preview URL'ini logla
      if (process.env.NODE_ENV !== 'production') {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        logger.info(`📧 Test email sent. Preview URL: ${previewUrl}`);
      }
      
      logger.info(`📧 Email sent successfully to ${options.email}: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error(`❌ Error sending email to ${options.email}:`, error.message);
      throw error;
    }
  }

  /**
   * Hoş geldin e-postası şablonu
   */
  getWelcomeEmailTemplate(user, verificationUrl) {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; }
            .button { 
                display: inline-block; 
                background-color: #2563eb; 
                color: white; 
                padding: 12px 30px; 
                text-decoration: none; 
                border-radius: 5px; 
                margin: 20px 0;
            }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚗 Rent-a-Car'a Hoş Geldiniz!</h1>
            </div>
            <div class="content">
                <h2>Merhaba ${user.name} ${user.surname},</h2>
                <p>Rent-a-Car sistemine kaydınız başarıyla tamamlanmıştır. Hesabınızı aktifleştirmek için e-posta adresinizi doğrulamanız gerekmektedir.</p>
                
                <p><strong>Hesap Bilgileriniz:</strong></p>
                <ul>
                    <li><strong>Ad Soyad:</strong> ${user.name} ${user.surname}</li>
                    <li><strong>E-posta:</strong> ${user.email}</li>
                    <li><strong>Telefon:</strong> ${user.phone}</li>
                </ul>

                <p>Aşağıdaki butona tıklayarak e-posta adresinizi doğrulayabilirsiniz:</p>
                
                <div style="text-align: center;">
                    <a href="${verificationUrl}" class="button">E-postamı Doğrula</a>
                </div>
                
                <p><small>Buton çalışmıyorsa, aşağıdaki bağlantıyı kopyalayıp tarayıcınıza yapıştırabilirsiniz:<br>
                <a href="${verificationUrl}">${verificationUrl}</a></small></p>
                
                <p><strong>⚠️ Önemli:</strong> Bu doğrulama bağlantısı 24 saat geçerlidir.</p>
                
                <p>Eğer bu hesabı siz oluşturmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
            </div>
            <div class="footer">
                <p>İyi günler dileriz,<br><strong>Rent-a-Car Ekibi</strong></p>
                <p><small>Bu otomatik bir e-postadır, lütfen cevaplamayınız.</small></p>
            </div>
        </div>
    </body>
    </html>
    `;

    const text = `
Merhaba ${user.name} ${user.surname},

Rent-a-Car sistemine hoş geldiniz! Hesabınızı aktifleştirmek için aşağıdaki bağlantıya tıklayarak e-posta adresinizi doğrulamanız gerekmektedir.

Doğrulama Bağlantısı: ${verificationUrl}

Bu bağlantı 24 saat geçerlidir.

Eğer bu hesabı siz oluşturmadıysanız, bu e-postayı görmezden gelebilirsiniz.

İyi günler dileriz,
Rent-a-Car Ekibi
    `;

    return { html, text };
  }

  /**
   * Şifre sıfırlama e-postası şablonu
   */
  getPasswordResetTemplate(user, resetUrl) {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; }
            .button { 
                display: inline-block; 
                background-color: #dc2626; 
                color: white; 
                padding: 12px 30px; 
                text-decoration: none; 
                border-radius: 5px; 
                margin: 20px 0;
            }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Şifre Sıfırlama</h1>
            </div>
            <div class="content">
                <h2>Merhaba ${user.name} ${user.surname},</h2>
                <p>Şifre sıfırlama talebiniz alınmıştır. Yeni bir şifre belirlemek için aşağıdaki butona tıklayın:</p>
                
                <div style="text-align: center;">
                    <a href="${resetUrl}" class="button">Şifremi Sıfırla</a>
                </div>
                
                <p><strong>⚠️ Önemli:</strong> Bu bağlantı 1 saat geçerlidir.</p>
                
                <p>Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
            </div>
            <div class="footer">
                <p>Rent-a-Car Ekibi</p>
            </div>
        </div>
    </body>
    </html>
    `;

    return { html };
  }
}

// Singleton instance
module.exports = new EmailHelper();