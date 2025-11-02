// frontend/src/config/env.ts

/**
 * 🎓 ÖĞREN: Environment Variables (Ortam Değişkenleri)
 * 
 * Environment variables, farklı ortamlarda (dev, prod) farklı değerlere sahip
 * ayarlardır. API URL'leri, API key'leri gibi bilgiler burada tutulur.
 * 
 * ✅ AVANTAJLAR:
 * - Kod içinde sabit değer yok (hardcoded)
 * - Development ve Production farklı ayarlar
 * - Güvenlik: API key'ler kodda görünmez
 * - Kolay değiştirilebilir
 * 
 * 📝 VITE KURALI:
 * - VITE_* ile başlamalı (yoksa import.meta.env'de görünmez)
 * - .env dosyasında tanımlanmalı
 * - Tip güvenliği için burada interface tanımlanmalı
 */

/**
 * 🎯 Environment Variables Interface
 * 
 * TypeScript tip güvenliği için tüm env variable'ların tipini tanımlıyoruz.
 * Böylece yanlış değişken adı yazarsak IDE hata verir.
 */
interface EnvConfig {
  // 🌐 API Ayarları
  apiUrl: string;              // Backend API base URL
  apiTimeout: number;          // API request timeout (ms)
  
  // 🔐 Auth Ayarları
  tokenKey: string;            // LocalStorage'da token key'i
  refreshTokenKey: string;     // Refresh token key'i
  
  // 🎨 Uygulama Ayarları
  appName: string;             // Uygulama adı
  appVersion: string;          // Versiyon
  
  // 🌍 Genel Ayarlar
  isDevelopment: boolean;      // Development ortamı mı?
  isProduction: boolean;       // Production ortamı mı?
  
  // 📊 Diğer Ayarlar
  enableAnalytics: boolean;    // Analytics aktif mi?
  enableDevTools: boolean;     // Redux DevTools aktif mi?
}

/**
 * 🛠️ Helper Fonksiyon: Env değişkenini al
 * 
 * Tanımsızsa hata fırlat, yoksa default değer kullan.
 */
const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key];
  
  if (value === undefined) {
    if (defaultValue !== undefined) {
      console.warn(`⚠️ ENV: ${key} tanımsız, default değer kullanılıyor: ${defaultValue}`);
      return defaultValue;
    }
    throw new Error(`❌ ENV: ${key} tanımlı değil!`);
  }
  
  return value;
};

/**
 * 📦 Environment Configuration
 * 
 * Tüm environment değişkenlerini buradan export ediyoruz.
 * Böylece uygulama genelinde tek bir kaynaktan okuyoruz.
 */
export const env: EnvConfig = {
  // 🌐 API Configuration
  apiUrl: getEnvVar('VITE_API_URL', 'http://localhost:3000/api'),
  apiTimeout: parseInt(getEnvVar('VITE_API_TIMEOUT', '30000')),
  
  // 🔐 Authentication
  tokenKey: getEnvVar('VITE_TOKEN_KEY', 'auth_token'),
  refreshTokenKey: getEnvVar('VITE_REFRESH_TOKEN_KEY', 'refresh_token'),
  
  // 🎨 Application
  appName: getEnvVar('VITE_APP_NAME', 'E-Commerce App'),
  appVersion: getEnvVar('VITE_APP_VERSION', '1.0.0'),
  
  // 🌍 Environment
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  // 📊 Features
  enableAnalytics: getEnvVar('VITE_ENABLE_ANALYTICS', 'false') === 'true',
  enableDevTools: import.meta.env.DEV,
};

/**
 * 🎯 KULLANIM ÖRNEĞİ:
 * 
 * import { env } from '@/config/env';
 * 
 * // API URL'i kullan
 * const response = await fetch(`${env.apiUrl}/products`);
 * 
 * // Development ortamında log
 * if (env.isDevelopment) {
 *   console.log('Debug bilgisi:', data);
 * }
 * 
 * // Token'ı kaydet
 * localStorage.setItem(env.tokenKey, token);
 */

/**
 * 📄 .env DOSYASI ÖRNEĞİ:
 * 
 * frontend/.env.development:
 * 
 * VITE_API_URL=http://localhost:3000/api
 * VITE_API_TIMEOUT=30000
 * VITE_TOKEN_KEY=auth_token
 * VITE_REFRESH_TOKEN_KEY=refresh_token
 * VITE_APP_NAME=E-Commerce Dev
 * VITE_APP_VERSION=1.0.0-dev
 * VITE_ENABLE_ANALYTICS=false
 * 
 * 
 * frontend/.env.production:
 * 
 * VITE_API_URL=https://api.myapp.com/api
 * VITE_API_TIMEOUT=15000
 * VITE_TOKEN_KEY=auth_token
 * VITE_REFRESH_TOKEN_KEY=refresh_token
 * VITE_APP_NAME=E-Commerce
 * VITE_APP_VERSION=1.0.0
 * VITE_ENABLE_ANALYTICS=true
 */

/**
 * 🔒 GÜVENLİK UYARISI:
 * 
 * ❌ .env dosyasında ASLA şunları tutma:
 * - API Secret Key'ler
 * - Database şifreleri
 * - Private key'ler
 * 
 * ✅ Sadece public bilgiler:
 * - API URL'leri
 * - Public API key'ler (örn: Google Maps Public Key)
 * - Feature flag'ler
 * 
 * 💡 Backend tarafında secret key'leri tut!
 */

// Export default olarak da kullanılabilir
export default env;