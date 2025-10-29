const { helpers, logger } = require('@ecommerce/shared-utils');
const { EmailHelper } = helpers; // shared-utils'dan EmailHelper'ı al

class EmailHandler {

  /**
   * Sipariş oluşturulduğunda gönderilecek e-posta.
   * @param {object} payload - { orderId, userEmail, userName, orderNumber, total }
   */
  static async sendOrderConfirmationEmail(payload) {
    const { userEmail, userName, orderNumber, total } = payload;
    if (!userEmail || !orderNumber) {
        logger.warn('[EmailHandler] Missing required fields for order confirmation email.', payload);
        return;
    }

    // Basit bir e-posta içeriği oluşturalım
    const subject = `✅ Siparişiniz Alındı - No: ${orderNumber}`;
    const text = `Merhaba ${userName || 'Değerli Müşterimiz'},\n\n${orderNumber} numaralı siparişiniz başarıyla alınmıştır.\nToplam Tutar: ${total} TRY\n\nTeşekkür ederiz!`;
    const html = `<p>Merhaba ${userName || 'Değerli Müşterimiz'},</p>
                  <p>${orderNumber} numaralı siparişiniz başarıyla alınmıştır.</p>
                  <p><b>Toplam Tutar:</b> ${total} TRY</p>
                  <p>Teşekkür ederiz!</p>`;

    try {
      await EmailHelper.sendEmail({ email: userEmail, subject, message: text, html }); // EmailHelper'ı kullan
      logger.info(`Order confirmation email sent to ${userEmail} for order ${orderNumber}`);
    } catch (error) {
      logger.error(`Failed to send order confirmation email to ${userEmail}:`, error);
      // Hata yönetimi: Belki tekrar deneme mekanizması veya loglama.
    }
  }

  /**
   * E-posta doğrulama linki gönderir.
   * @param {object} payload - { userEmail, userName, verificationUrl }
   */
  static async sendVerificationEmail(payload) {
      const { userEmail, userName, verificationUrl } = payload;
      if (!userEmail || !verificationUrl) {
          logger.warn('[EmailHandler] Missing required fields for verification email.', payload);
          return;
      }

      // shared-utils'daki şablonu kullanabiliriz, ancak buraya da ekleyelim
      const subject = '📧 E-posta Adresinizi Doğrulayın';
      const text = `Merhaba ${userName || ''},\nHesabınızı doğrulamak için lütfen aşağıdaki bağlantıya tıklayın:\n${verificationUrl}\nBu bağlantı 24 saat geçerlidir.`;
      const html = `<p>Merhaba ${userName || ''},</p>
                    <p>Hesabınızı doğrulamak için lütfen aşağıdaki bağlantıya tıklayın:</p>
                    <p><a href="${verificationUrl}">E-postamı Doğrula</a></p>
                    <p>Bu bağlantı 24 saat geçerlidir.</p>
                    <p><small>Bağlantı çalışmazsa, tarayıcınıza yapıştırın: ${verificationUrl}</small></p>`;

      try {
          await EmailHelper.sendEmail({ email: userEmail, subject, message: text, html }); //
          logger.info(`Verification email sent to ${userEmail}`);
      } catch (error) {
          logger.error(`Failed to send verification email to ${userEmail}:`, error);
      }
  }

  /**
   * Şifre sıfırlama linki gönderir.
   * @param {object} payload - { userEmail, userName, resetUrl }
   */
  static async sendPasswordResetEmail(payload) {
    const { userEmail, userName, resetUrl } = payload;
     if (!userEmail || !resetUrl) {
          logger.warn('[EmailHandler] Missing required fields for password reset email.', payload);
          return;
      }

      const subject = '🔑 Şifre Sıfırlama İsteği';
      const text = `Merhaba ${userName || ''},\nŞifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:\n${resetUrl}\nBu bağlantı 1 saat geçerlidir.\nEğer bu isteği siz yapmadıysanız, bu e-postayı görmezden gelin.`;
      const html = `<p>Merhaba ${userName || ''},</p>
                    <p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>
                    <p><a href="${resetUrl}">Şifremi Sıfırla</a></p>
                    <p>Bu bağlantı 1 saat geçerlidir.</p>
                    <p><small>Bağlantı çalışmazsa, tarayıcınıza yapıştırın: ${resetUrl}</small></p>
                    <p>Eğer bu isteği siz yapmadıysanız, bu e-postayı görmezden gelin.</p>`;

       try {
          await EmailHelper.sendEmail({ email: userEmail, subject, message: text, html }); //
          logger.info(`Password reset email sent to ${userEmail}`);
      } catch (error) {
          logger.error(`Failed to send password reset email to ${userEmail}:`, error);
      }
  }

  /**
   * Sipariş durumu güncellendiğinde gönderilecek e-posta (Örnek)
   * @param {object} payload - { orderId, userEmail, userName, orderNumber, newStatus, trackingNumber?, carrier? }
   */
  static async sendOrderStatusUpdateEmail(payload) {
      const { userEmail, userName, orderNumber, newStatus, trackingNumber, carrier } = payload;
       if (!userEmail || !orderNumber || !newStatus) {
           logger.warn('[EmailHandler] Missing required fields for order status update email.', payload);
           return;
       }

      let statusText = newStatus;
      // Duruma göre metni güzelleştirebiliriz
      switch(newStatus) {
          case 'shipped': statusText = 'Kargoya Verildi'; break;
          case 'delivered': statusText = 'Teslim Edildi'; break;
          case 'cancelled': statusText = 'İptal Edildi'; break;
          // ... diğer durumlar
      }

      const subject = `📦 Sipariş Durumu Güncellendi - No: ${orderNumber}`;
      let text = `Merhaba ${userName || 'Değerli Müşterimiz'},\n\n${orderNumber} numaralı siparişinizin durumu "${statusText}" olarak güncellenmiştir.\n`;
      let html = `<p>Merhaba ${userName || 'Değerli Müşterimiz'},</p>
                  <p>${orderNumber} numaralı siparişinizin durumu <b>${statusText}</b> olarak güncellenmiştir.</p>`;

      if (newStatus === 'shipped' && trackingNumber) {
          text += `Kargo Takip Numarası: ${trackingNumber} (${carrier || 'Bilinmeyen Kargo'})\n`;
          html += `<p><b>Kargo Takip Numarası:</b> ${trackingNumber} (${carrier || 'Bilinmeyen Kargo'})</p>`;
      }

      text += `\nSipariş detaylarınızı hesabınızdan takip edebilirsiniz.\nTeşekkür ederiz!`;
      html += `<p>Sipariş detaylarınızı hesabınızdan takip edebilirsiniz.</p><p>Teşekkür ederiz!</p>`;

      try {
          await EmailHelper.sendEmail({ email: userEmail, subject, message: text, html }); //
          logger.info(`Order status update email sent to ${userEmail} for order ${orderNumber} (New status: ${newStatus})`);
      } catch (error) {
          logger.error(`Failed to send order status update email to ${userEmail}:`, error);
      }
  }

    // ... Diğer bildirim türleri için metodlar eklenebilir (örn: sendWelcomeEmail, sendPasswordChangedEmail vb.)
}

module.exports = EmailHandler;