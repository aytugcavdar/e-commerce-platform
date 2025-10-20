module.exports = {
  // Auth & User Errors
  INVALID_CREDENTIALS: 'Geçersiz e-posta veya şifre.',
  USER_NOT_FOUND: 'Belirtilen bilgilere sahip kullanıcı bulunamadı.',
  USER_ALREADY_EXISTS: 'Bu e-posta adresi zaten kayıtlı.',
  EMAIL_NOT_VERIFIED: 'Lütfen önce e-posta adresinizi doğrulayın.',
  ACCOUNT_LOCKED: 'Çok fazla hatalı giriş denemesi. Hesabınız geçici olarak kilitlendi.',
  UNAUTHORIZED: 'Bu işlemi yapmak için giriş yapmalısınız.',
  FORBIDDEN: 'Bu işlemi yapmak için yetkiniz bulunmamaktadır.',
  TOKEN_EXPIRED: 'Oturum süreniz doldu. Lütfen tekrar giriş yapın.',
  INVALID_TOKEN: 'Geçersiz veya hatalı token.',

  // Validation Errors
  VALIDATION_ERROR: 'Girilen verilerde doğrulama hatası bulundu.',
  INVALID_INPUT: 'Geçersiz giriş verisi.',
  MISSING_REQUIRED_FIELDS: 'Gerekli alanlar eksik.',
  INVALID_ID_FORMAT: 'Geçersiz ID formatı.',

  // Product Errors
  PRODUCT_NOT_FOUND: 'Ürün bulunamadı.',
  INSUFFICIENT_STOCK: 'Yetersiz stok.',

  // Order Errors
  ORDER_NOT_FOUND: 'Sipariş bulunamadı.',
  CANNOT_CANCEL_ORDER: 'Bu sipariş durumu iptal edilemez.',

  // General Server Errors
  INTERNAL_ERROR: 'Beklenmedik bir sunucu hatası oluştu.',
  SERVICE_UNAVAILABLE: 'İstenen hizmet şu anda kullanılamıyor.',
  DATABASE_ERROR: 'Veritabanı işlemi sırasında bir hata oluştu.',
  RATE_LIMIT_EXCEEDED: 'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.',

  // File Upload Errors
  FILE_TOO_LARGE: 'Dosya boyutu çok büyük.',
  INVALID_FILE_TYPE: 'Geçersiz dosya türü.',
  UPLOAD_FAILED: 'Dosya yüklenirken bir hata oluştu.',
};