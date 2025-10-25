module.exports = {
  // ========================================
  // AUTH & USER ERRORS
  // ========================================
  INVALID_CREDENTIALS: 'Geçersiz e-posta veya şifre.',
  USER_NOT_FOUND: 'Belirtilen bilgilere sahip kullanıcı bulunamadı.',
  USER_ALREADY_EXISTS: 'Bu e-posta adresi zaten kayıtlı.',
  EMAIL_NOT_VERIFIED: 'Lütfen önce e-posta adresinizi doğrulayın.',
  ACCOUNT_LOCKED: 'Çok fazla hatalı giriş denemesi. Hesabınız geçici olarak kilitlendi.',
  UNAUTHORIZED: 'Bu işlemi yapmak için giriş yapmalısınız.',
  FORBIDDEN: 'Bu işlemi yapmak için yetkiniz bulunmamaktadır.',
  TOKEN_EXPIRED: 'Oturum süreniz doldu. Lütfen tekrar giriş yapın.',
  INVALID_TOKEN: 'Geçersiz veya hatalı token.',
  INVALID_VERIFICATION_TOKEN: 'Doğrulama bağlantısı geçersiz veya süresi dolmuş.',
  PASSWORD_RESET_TOKEN_EXPIRED: 'Şifre sıfırlama bağlantısının süresi dolmuş.',
  PASSWORD_RESET_TOKEN_INVALID: 'Geçersiz şifre sıfırlama bağlantısı.',
  WEAK_PASSWORD: 'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir.',

  // ========================================
  // VALIDATION ERRORS
  // ========================================
  VALIDATION_ERROR: 'Girilen verilerde doğrulama hatası bulundu.',
  INVALID_INPUT: 'Geçersiz giriş verisi.',
  MISSING_REQUIRED_FIELDS: 'Gerekli alanlar eksik.',
  INVALID_ID_FORMAT: 'Geçersiz ID formatı.',
  INVALID_EMAIL_FORMAT: 'Geçersiz e-posta formatı.',
  INVALID_PHONE_FORMAT: 'Geçersiz telefon numarası formatı.',
  INVALID_DATE_FORMAT: 'Geçersiz tarih formatı.',
  INVALID_PRICE_FORMAT: 'Geçersiz fiyat formatı.',
  INVALID_QUANTITY: 'Geçersiz miktar değeri.',
  INVALID_URL_FORMAT: 'Geçersiz URL formatı.',

  // ========================================
  // PRODUCT ERRORS
  // ========================================
  PRODUCT_NOT_FOUND: 'Ürün bulunamadı.',
  PRODUCT_ALREADY_EXISTS: 'Bu ürün zaten mevcut.',
  PRODUCT_OUT_OF_STOCK: 'Ürün stokta yok.',
  INSUFFICIENT_STOCK: 'Yetersiz stok.',
  PRODUCT_INACTIVE: 'Ürün aktif değil.',
  PRODUCT_DISCONTINUED: 'Ürün üretimi durdurulmuş.',
  INVALID_PRODUCT_STATUS: 'Geçersiz ürün durumu.',
  PRODUCT_HAS_ORDERS: 'Bu ürüne ait siparişler var, silinemez.',

  // ========================================
  // CATEGORY ERRORS
  // ========================================
  CATEGORY_NOT_FOUND: 'Kategori bulunamadı.',
  CATEGORY_ALREADY_EXISTS: 'Bu kategori zaten mevcut.',
  CATEGORY_HAS_SUBCATEGORIES: 'Bu kategorinin alt kategorileri var. Önce alt kategorileri silin.',
  CATEGORY_HAS_PRODUCTS: 'Bu kategoride ürünler var. Silmek için önce ürünleri taşıyın.',
  INVALID_PARENT_CATEGORY: 'Geçersiz ana kategori.',
  PARENT_CATEGORY_NOT_FOUND: 'Belirtilen ana kategori bulunamadı.',
  CATEGORY_CANNOT_BE_OWN_PARENT: 'Kategori kendi alt kategorisi olamaz.',
  SUBCATEGORY_CANNOT_BE_PARENT: 'Alt kategori, ana kategori yapılamaz.',
  CATEGORY_DEPTH_EXCEEDED: 'Kategori derinliği limiti aşıldı.',

  // ========================================
  // BRAND ERRORS
  // ========================================
  BRAND_NOT_FOUND: 'Marka bulunamadı.',
  BRAND_ALREADY_EXISTS: 'Bu marka zaten mevcut.',
  BRAND_HAS_PRODUCTS: 'Bu markaya ait ürünler var. Silmek için önce ürünleri taşıyın veya silin.',
  INVALID_BRAND_DATA: 'Geçersiz marka verisi.',

  // ========================================
  // ORDER ERRORS
  // ========================================
  ORDER_NOT_FOUND: 'Sipariş bulunamadı.',
  ORDER_ALREADY_CANCELLED: 'Sipariş zaten iptal edilmiş.',
  ORDER_ALREADY_DELIVERED: 'Sipariş zaten teslim edilmiş.',
  CANNOT_CANCEL_ORDER: 'Bu sipariş durumu iptal edilemez.',
  CANNOT_MODIFY_ORDER: 'Bu sipariş durumu değiştirilemez.',
  INVALID_ORDER_STATUS: 'Geçersiz sipariş durumu.',
  ORDER_TOTAL_MISMATCH: 'Sipariş tutarı uyuşmuyor.',
  EMPTY_CART: 'Sepetiniz boş.',

  // ========================================
  // PAYMENT ERRORS
  // ========================================
  PAYMENT_FAILED: 'Ödeme işlemi başarısız oldu.',
  PAYMENT_CANCELLED: 'Ödeme işlemi iptal edildi.',
  PAYMENT_TIMEOUT: 'Ödeme işlemi zaman aşımına uğradı.',
  INVALID_PAYMENT_METHOD: 'Geçersiz ödeme yöntemi.',
  INSUFFICIENT_FUNDS: 'Yetersiz bakiye.',
  PAYMENT_ALREADY_PROCESSED: 'Bu ödeme zaten işlenmiş.',

  // ========================================
  // CART ERRORS
  // ========================================
  CART_NOT_FOUND: 'Sepet bulunamadı.',
  CART_ITEM_NOT_FOUND: 'Sepet ögesi bulunamadı.',
  CART_IS_EMPTY: 'Sepetiniz boş.',
  CART_QUANTITY_EXCEEDED: 'Maksimum sipariş miktarı aşıldı.',
  INVALID_CART_ITEM: 'Geçersiz sepet ögesi.',

  // ========================================
  // ADDRESS ERRORS
  // ========================================
  ADDRESS_NOT_FOUND: 'Adres bulunamadı.',
  INVALID_ADDRESS_DATA: 'Geçersiz adres bilgisi.',
  DEFAULT_ADDRESS_REQUIRED: 'Varsayılan adres gerekli.',
  CANNOT_DELETE_DEFAULT_ADDRESS: 'Varsayılan adres silinemez.',

  // ========================================
  // REVIEW & RATING ERRORS
  // ========================================
  REVIEW_NOT_FOUND: 'Yorum bulunamadı.',
  REVIEW_ALREADY_EXISTS: 'Bu ürün için zaten yorum yapmışsınız.',
  CANNOT_REVIEW_OWN_PRODUCT: 'Kendi ürününüze yorum yapamazsınız.',
  MUST_PURCHASE_TO_REVIEW: 'Yorum yapmak için ürünü satın almış olmalısınız.',
  INVALID_RATING: 'Geçersiz puanlama değeri.',

  // ========================================
  // COUPON & DISCOUNT ERRORS
  // ========================================
  COUPON_NOT_FOUND: 'Kupon bulunamadı.',
  COUPON_EXPIRED: 'Kuponun süresi dolmuş.',
  COUPON_NOT_ACTIVE: 'Kupon aktif değil.',
  COUPON_ALREADY_USED: 'Bu kupon daha önce kullanılmış.',
  COUPON_USAGE_LIMIT_EXCEEDED: 'Kupon kullanım limiti aşıldı.',
  MINIMUM_ORDER_NOT_MET: 'Minimum sipariş tutarı sağlanmadı.',
  INVALID_COUPON_CODE: 'Geçersiz kupon kodu.',

  // ========================================
  // WISHLIST ERRORS
  // ========================================
  WISHLIST_NOT_FOUND: 'İstek listesi bulunamadı.',
  PRODUCT_ALREADY_IN_WISHLIST: 'Ürün zaten istek listesinde.',
  PRODUCT_NOT_IN_WISHLIST: 'Ürün istek listesinde bulunamadı.',

  // ========================================
  // SHIPPING ERRORS
  // ========================================
  SHIPPING_ADDRESS_REQUIRED: 'Teslimat adresi gerekli.',
  SHIPPING_METHOD_NOT_AVAILABLE: 'Seçilen teslimat yöntemi mevcut değil.',
  SHIPPING_CALCULATION_FAILED: 'Kargo ücreti hesaplanamadı.',
  INVALID_SHIPPING_METHOD: 'Geçersiz kargo yöntemi.',

  // ========================================
  // FILE UPLOAD ERRORS
  // ========================================
  FILE_TOO_LARGE: 'Dosya boyutu çok büyük.',
  INVALID_FILE_TYPE: 'Geçersiz dosya türü.',
  UPLOAD_FAILED: 'Dosya yüklenirken bir hata oluştu.',
  FILE_NOT_FOUND: 'Dosya bulunamadı.',
  TOO_MANY_FILES: 'Çok fazla dosya yüklendi.',
  IMAGE_UPLOAD_FAILED: 'Resim yüklenirken hata oluştu.',
  IMAGE_DELETE_FAILED: 'Resim silinirken hata oluştu.',
  UNSUPPORTED_IMAGE_FORMAT: 'Desteklenmeyen resim formatı.',

  // ========================================
  // GENERAL SERVER ERRORS
  // ========================================
  INTERNAL_ERROR: 'Beklenmedik bir sunucu hatası oluştu.',
  SERVICE_UNAVAILABLE: 'İstenen hizmet şu anda kullanılamıyor.',
  DATABASE_ERROR: 'Veritabanı işlemi sırasında bir hata oluştu.',
  DATABASE_CONNECTION_ERROR: 'Veritabanı bağlantısı kurulamadı.',
  RATE_LIMIT_EXCEEDED: 'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.',
  NETWORK_ERROR: 'Ağ bağlantısı hatası.',
  TIMEOUT_ERROR: 'İstek zaman aşımına uğradı.',
  RESOURCE_NOT_FOUND: 'İstenen kaynak bulunamadı.',
  DUPLICATE_ENTRY: 'Bu kayıt zaten mevcut.',
  OPERATION_FAILED: 'İşlem başarısız oldu.',
  CONFIGURATION_ERROR: 'Sistem yapılandırma hatası.',

  // ========================================
  // NOTIFICATION ERRORS
  // ========================================
  EMAIL_SEND_FAILED: 'E-posta gönderilemedi.',
  SMS_SEND_FAILED: 'SMS gönderilemedi.',
  NOTIFICATION_FAILED: 'Bildirim gönderilemedi.',
  INVALID_EMAIL_ADDRESS: 'Geçersiz e-posta adresi.',

  // ========================================
  // SEARCH & FILTER ERRORS
  // ========================================
  INVALID_SEARCH_QUERY: 'Geçersiz arama sorgusu.',
  INVALID_FILTER_CRITERIA: 'Geçersiz filtreleme kriteri.',
  NO_RESULTS_FOUND: 'Sonuç bulunamadı.',
  SEARCH_SERVICE_UNAVAILABLE: 'Arama servisi şu anda kullanılamıyor.',

  // ========================================
  // INVENTORY ERRORS
  // ========================================
  STOCK_UPDATE_FAILED: 'Stok güncellenemedi.',
  INVALID_STOCK_QUANTITY: 'Geçersiz stok miktarı.',
  NEGATIVE_STOCK_NOT_ALLOWED: 'Negatif stok değerine izin verilmiyor.',
  STOCK_RESERVATION_FAILED: 'Stok rezerve edilemedi.',

  // ========================================
  // SESSION & COOKIE ERRORS
  // ========================================
  SESSION_EXPIRED: 'Oturumunuz sona erdi.',
  INVALID_SESSION: 'Geçersiz oturum.',
  COOKIE_NOT_FOUND: 'Çerez bulunamadı.',
  
  // ========================================
  // PERMISSION ERRORS
  // ========================================
  ACCESS_DENIED: 'Erişim reddedildi.',
  ADMIN_ONLY: 'Bu işlem sadece yöneticiler tarafından yapılabilir.',
  SELLER_ONLY: 'Bu işlem sadece satıcılar tarafından yapılabilir.',
  OWNER_ONLY: 'Bu işlem sadece kayıt sahibi tarafından yapılabilir.',
  INSUFFICIENT_PERMISSIONS: 'Yetersiz izin.',

  // ========================================
  // THIRD-PARTY SERVICE ERRORS
  // ========================================
  PAYMENT_GATEWAY_ERROR: 'Ödeme servisi hatası.',
  SHIPPING_SERVICE_ERROR: 'Kargo servisi hatası.',
  EMAIL_SERVICE_ERROR: 'E-posta servisi hatası.',
  SMS_SERVICE_ERROR: 'SMS servisi hatası.',
  STORAGE_SERVICE_ERROR: 'Depolama servisi hatası.',
  CLOUDINARY_ERROR: 'Cloudinary servisi hatası.',

  // ========================================
  // BUSINESS LOGIC ERRORS
  // ========================================
  INVALID_OPERATION: 'Geçersiz işlem.',
  OPERATION_NOT_ALLOWED: 'Bu işleme izin verilmiyor.',
  BUSINESS_RULE_VIOLATION: 'İş kuralı ihlali.',
  CONFLICT: 'Çakışma hatası.',
  PRECONDITION_FAILED: 'Ön koşul sağlanamadı.',
};