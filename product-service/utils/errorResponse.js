class ErrorResponse extends Error {
  /**
   * Geliştirilmiş özel ErrorResponse nesnesi oluşturur.
   * @param {string} message - Hata mesajı (insan tarafından okunabilir).
   * @param {number} statusCode - HTTP durum kodu (örn: 400, 404, 500).
   * @param {string} [errorCode=null] - Opsiyonel, uygulamaya özel hata kodu (örn: 'AUTH_FAILED').
   * @param {boolean} [isOperational=true] - Bu hatanın operasyonel (beklenen) bir hata olup olmadığını belirtir.
   * @param {Object} [additionalInfo={}] - Hata hakkında ek bilgiler içeren nesne.
   */
  constructor(message, statusCode, errorCode = null, isOperational = true, additionalInfo = {}) {
    super(message); // Üst sınıfın (Error) constructor'ını çağırır
    
    this.name = this.constructor.name; // Hata sınıfının adını ata
    this.statusCode = statusCode; // HTTP durum kodu
    this.errorCode = errorCode;   // Uygulamaya özel hata kodu
    this.isOperational = isOperational; // Operasyonel hata mı?
    this.additionalInfo = additionalInfo; // Ek bilgiler
    
    // Durum koduna göre basit sınıflandırma (4xx -> fail, 5xx -> error)
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    // Hata loglaması için daha kapsamlı bilgi
    this.logError();
    
    // Bu satır, hatanın oluştuğu yerin izini (stack trace) yakalar
    // ve constructor çağrısını stack trace'den çıkarır.
    Error.captureStackTrace(this, this.constructor);
  }
  
  /**
   * Hata bilgilerini loglama fonksiyonu
   * Daha sonra günlük yönetim sistemlerine entegrasyon için genişletilebilir
   */
  logError() {
    console.log('--------- HATA BİLGİLERİ ---------');
    console.log(`Hata Mesajı: ${this.message}`);
    console.log(`Durum Kodu: ${this.statusCode}`);
    console.log(`Hata Tipi: ${this.status}`);
    
    if (this.errorCode) {
      console.log(`Hata Kodu: ${this.errorCode}`);
    }
    
    if (Object.keys(this.additionalInfo).length > 0) {
      console.log('Ek Bilgiler:', JSON.stringify(this.additionalInfo, null, 2));
    }
    
    console.log('----------------------------------');
  }

  /**
   * Hata nesnesinin JSON'a nasıl dönüştürüleceğini kontrol eder.
   * API yanıtları için kullanışlıdır. Üretim ortamında stack trace'i içermez.
   * @returns {Object} JSON formatında hata detayları
   */
  toJSON() {
    const errorDetails = {
      success: false, // API yanıt yapısında tutarlılık için
      status: this.status,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: new Date().toISOString() // Hatanın oluştuğu zaman damgası
    };
    
    // Eğer bir errorCode varsa, onu da yanıta ekle
    if (this.errorCode) {
      errorDetails.errorCode = this.errorCode;
    }
    
    // Ek bilgileri ekle
    if (Object.keys(this.additionalInfo).length > 0) {
      errorDetails.details = this.additionalInfo;
    }
    
    // ÖNEMLİ: Stack trace'i sadece geliştirme ortamında dahil et!
    // Güvenlik nedeniyle üretim ortamında asla stack trace gösterme!
    if (process.env.NODE_ENV === 'development') {
      errorDetails.stack = this.stack;
    }
    
    return errorDetails;
  }
  
  /**
   * HTTP yanıtı formatında hata nesnesini döndürür
   * Express middleware'de kullanım için uygun format
   * @returns {Object} HTTP yanıtı için formatlı hata nesnesi
   */
  toHttpResponse() {
    return {
      headers: {
        'Content-Type': 'application/json'
      },
      statusCode: this.statusCode,
      body: JSON.stringify(this.toJSON())
    };
  }
  
  /**
   * Statik yardımcı metod: Bir hatayı ErrorResponse nesnesine dönüştürür
   * @param {Error} error - Dönüştürülecek hata
   * @param {number} [defaultStatusCode=500] - Varsayılan HTTP durum kodu
   * @returns {ErrorResponse} ErrorResponse nesnesi
   */
  static fromError(error, defaultStatusCode = 500) {
    // Eğer zaten bir ErrorResponse ise, doğrudan döndür
    if (error instanceof ErrorResponse) {
      return error;
    }
    
    // Standart bir Error nesnesini ErrorResponse'a dönüştür
    return new ErrorResponse(
      error.message || 'Bir hata oluştu',
      defaultStatusCode,
      'INTERNAL_ERROR',
      false, // Operasyonel olmayan hata
      { originalError: error.name }
    );
  }
}

module.exports = ErrorResponse;