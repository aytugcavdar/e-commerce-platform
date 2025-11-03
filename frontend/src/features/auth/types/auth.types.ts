// frontend/src/features/auth/types/auth.types.ts

/**
 * 🎓 ÖĞREN: TypeScript Tipleri Neden Önemli?
 * 
 * TypeScript, JavaScript'e tip güvenliği ekler:
 * 
 * ❌ JavaScript:
 * const user = { name: "Ali" };
 * user.age = "25"; // String verebilirim, hata yok!
 * 
 * ✅ TypeScript:
 * const user: User = { name: "Ali", age: 25 };
 * user.age = "25"; // ❌ HATA! Number olmalı
 * 
 * Avantajları:
 * - IDE otomatik tamamlama
 * - Hataları yazarken yakala (runtime değil!)
 * - Dokümantasyon görevi görür
 * - Refactoring güvenli
 */

/**
 * 👤 USER - Kullanıcı Bilgileri
 * 
 * Backend'den dönen kullanıcı objesi
 */
export interface User {
  _id: string;                    // MongoDB ID
  firstName: string;              // Ad
  lastName: string;               // Soyad
  email: string;                  // E-posta
  phone?: string;                 // Telefon (opsiyonel)
  avatarUrl?: string;             // Profil resmi URL
  role: 'customer' | 'admin' | 'seller';  // Rol
  
  // Durum bilgileri
  isEmailVerified: boolean;       // E-posta doğrulandı mı?
  isActive: boolean;              // Hesap aktif mi?
  isBlocked: boolean;             // Hesap bloklu mu?
  
  // İstatistikler
  totalOrders: number;            // Toplam sipariş sayısı
  totalSpent: number;             // Toplam harcama
  
  // Tarihler
  lastLogin?: Date;               // Son giriş
  createdAt: Date;                // Kayıt tarihi
  updatedAt: Date;                // Güncelleme tarihi
}

/**
 * 🔑 AUTH STATE - Redux State Yapısı
 * 
 * Redux store'da auth slice'ının yapısı
 */
export interface AuthState {
  // Kullanıcı bilgisi
  user: User | null;              // Giriş yapıldıysa User objesi, yoksa null
  
  // Token bilgileri
  token: string | null;           // JWT access token
  refreshToken: string | null;    // JWT refresh token
  
  // Durum bilgileri
  isAuthenticated: boolean;       // Giriş yapılmış mı?
  loading: boolean;               // API isteği devam ediyor mu?
  error: string | null;           // Hata mesajı varsa
  
  // İşlem durumları
  isLoggingIn: boolean;           // Login isteği yapılıyor mu?
  isRegistering: boolean;         // Register isteği yapılıyor mu?
  isLoggingOut: boolean;          // Logout isteği yapılıyor mu?
}

/**
 * 📝 LOGIN REQUEST - Giriş İstek Payload
 */
export interface LoginRequest {
  email: string;                  // E-posta
  password: string;               // Şifre
  rememberMe?: boolean;           // Beni hatırla
}

/**
 * 📝 LOGIN RESPONSE - Giriş Cevap Payload
 */
export interface LoginResponse {
  success: boolean;               // İşlem başarılı mı?
  message: string;                // Mesaj
  data: {
    user: User;                   // Kullanıcı bilgileri
    token: string;                // Access token
    refreshToken: string;         // Refresh token
  };
}

/**
 * 📝 REGISTER REQUEST - Kayıt İstek Payload
 */
export interface RegisterRequest {
  firstName: string;              // Ad
  lastName: string;               // Soyad
  email: string;                  // E-posta
  password: string;               // Şifre
  passwordConfirm: string;        // Şifre tekrarı
  phone?: string;                 // Telefon (opsiyonel)
  avatar?: File;                  // Profil resmi (opsiyonel)
}

/**
 * 📝 REGISTER RESPONSE - Kayıt Cevap Payload
 */
export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

/**
 * 📝 VERIFY EMAIL REQUEST - E-posta Doğrulama İstek
 */
export interface VerifyEmailRequest {
  token: string;                  // URL'den gelen token
}

/**
 * 📝 FORGOT PASSWORD REQUEST - Şifremi Unuttum İstek
 */
export interface ForgotPasswordRequest {
  email: string;                  // E-posta
}

/**
 * 📝 RESET PASSWORD REQUEST - Şifre Sıfırlama İstek
 */
export interface ResetPasswordRequest {
  token: string;                  // URL'den gelen token
  email: string;                  // E-posta
  password: string;               // Yeni şifre
  passwordConfirm: string;        // Yeni şifre tekrarı
}

/**
 * 📝 CHANGE PASSWORD REQUEST - Şifre Değiştirme İstek
 */
export interface ChangePasswordRequest {
  currentPassword: string;        // Mevcut şifre
  newPassword: string;            // Yeni şifre
  newPasswordConfirm: string;     // Yeni şifre tekrarı
}

/**
 * 🎯 AUTH ERROR - Hata Tipleri
 * 
 * Farklı hata türlerini ayırt etmek için
 */
export type AuthErrorType = 
  | 'INVALID_CREDENTIALS'         // Geçersiz kullanıcı adı/şifre
  | 'EMAIL_NOT_VERIFIED'          // E-posta doğrulanmamış
  | 'ACCOUNT_BLOCKED'             // Hesap bloklanmış
  | 'TOKEN_EXPIRED'               // Token süresi dolmuş
  | 'NETWORK_ERROR'               // İnternet hatası
  | 'SERVER_ERROR'                // Sunucu hatası
  | 'VALIDATION_ERROR'            // Form doğrulama hatası
  | 'UNKNOWN_ERROR';              // Bilinmeyen hata

/**
 * 🎯 AUTH ERROR RESPONSE - Hata Cevap Yapısı
 */
export interface AuthErrorResponse {
  type: AuthErrorType;
  message: string;
  errors?: Record<string, string[]>; // Form hataları (field: [errors])
}

/**
 * 🎯 KULLANIM ÖRNEKLERİ:
 * 
 * // Component'te
 * const user: User | null = useAppSelector(state => state.auth.user);
 * 
 * // Redux thunk'ta
 * const loginData: LoginRequest = { email, password };
 * const response = await apiClient.post<LoginResponse>('/auth/login', loginData);
 * 
 * // Form validation
 * const handleRegister = (data: RegisterRequest) => {
 *   if (data.password !== data.passwordConfirm) {
 *     setError('Şifreler eşleşmiyor');
 *   }
 * };
 */

/**
 * 💡 PRO TIP: Tip Güvenliği
 * 
 * TypeScript sayesinde:
 * 
 * ✅ DOĞRU:
 * const loginRequest: LoginRequest = {
 *   email: "test@example.com",
 *   password: "123456"
 * };
 * 
 * ❌ HATA (IDE gösterir):
 * const loginRequest: LoginRequest = {
 *   email: "test@example.com",
 *   // password eksik!
 * };
 * 
 * ❌ HATA (IDE gösterir):
 * const loginRequest: LoginRequest = {
 *   email: "test@example.com",
 *   password: 123456  // String olmalı!
 * };
 */

/**
 * 🔥 BEST PRACTICE: Optional vs Required
 * 
 * ✅ Optional (?) kullan:
 * - Nullable olabilecek alanlar için
 * - Backend'den gelmeyebilecek alanlar için
 * 
 * phone?: string;     // Olabilir, olmayabilir
 * avatarUrl?: string; // Olabilir, olmayabilir
 * 
 * ✅ Required kullan:
 * - Mutlaka olması gereken alanlar için
 * 
 * email: string;      // Mutlaka olmalı
 * password: string;   // Mutlaka olmalı
 */