// frontend/src/shared/services/api/client.ts

import axios from 'axios';
import type { 
  AxiosError, 
  AxiosInstance, 
  InternalAxiosRequestConfig 
} from 'axios';
import { env } from '@/config/env';


/**
 * 🎓 ÖĞREN: Axios Interceptor Nedir?
 * 
 * Interceptor, her API isteğinden önce veya sonra çalışan fonksiyonlardır.
 * 
 * Kullanım Alanları:
 * - Token ekleme (Authorization header)
 * - Cookie yönetimi
 * - Hata yakalama (401, 403, 500)
 * - Token yenileme (refresh)
 * - Logging
 */

// ============================================
// 🔧 AXIOS INSTANCE
// ============================================

const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiUrl,
  timeout: env.apiTimeout,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ✅ Cookie gönderimi için kritik!
});

// ============================================
// 📤 REQUEST INTERCEPTOR
// ============================================

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // ✅ FormData için Content-Type header'ını KALDIR (axios otomatik ekleyecek)
    if (config.data instanceof FormData) {
      console.log('📦 FormData detected, removing Content-Type header');
      delete config.headers['Content-Type'];
    }

    // ✅ Cookie'leri logla (debug için)
    const cookies = document.cookie;
    console.log('📤 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      isFormData: config.data instanceof FormData,
      withCredentials: config.withCredentials,
      cookies: cookies ? cookies.substring(0, 100) + '...' : 'No cookies'
    });

    return config;
  },
  (error) => {
    console.error('❌ Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// ============================================
// 📥 RESPONSE INTERCEPTOR
// ============================================

// ✅ Retry tracker (aynı URL'yi arka arkaya 2 defadan fazla denemeyi engelle)
const retryTracker = new Map<string, number>();
const MAX_RETRY_COUNT = 1; // Sadece 1 kez retry yap

apiClient.interceptors.response.use(
  (response) => {
    // ✅ Başarılı response - retry counter'ı sıfırla
    const requestKey = `${response.config.method}-${response.config.url}`;
    retryTracker.delete(requestKey);

    // ✅ Response'u logla
    console.log('📥 API Response:', {
      url: response.config.url,
      status: response.status,
      cookies: document.cookie ? document.cookie.substring(0, 100) + '...' : 'No cookies'
    });

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { 
      _retry?: boolean; 
    };

    // ============================================
    // 🔐 401 UNAUTHORIZED - TOKEN YENİLEME
    // ============================================
    
    if (error.response?.status === 401 && originalRequest) {
      // ✅ Bu request daha önce retry edilmiş mi kontrol et
      const requestKey = `${originalRequest.method}-${originalRequest.url}`;
      const retryCount = retryTracker.get(requestKey) || 0;

      // ⚠️ KRITIK: Sonsuz döngüyü engelle
      if (originalRequest._retry || retryCount >= MAX_RETRY_COUNT) {
        console.error('🚫 Token yenileme başarısız veya çok fazla deneme!');
        retryTracker.delete(requestKey);
        
        // Kullanıcıyı login sayfasına yönlendir
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        
        return Promise.reject(error);
      }

      // ✅ Retry counter'ı artır
      retryTracker.set(requestKey, retryCount + 1);
      originalRequest._retry = true;

      try {
        console.log(`🔄 Token yenileniyor (Deneme ${retryCount + 1}/${MAX_RETRY_COUNT})...`);
        console.log('🍪 Mevcut cookie\'ler:', document.cookie);

        // ✅ Token yenile
        const refreshResponse = await axios.post(
          `${env.apiUrl}/auth/refresh-token`,
          {},
          {
            withCredentials: true, // ✅ Cookie gönder/al
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        console.log('✅ Token yenilendi:', refreshResponse.status);
        console.log('🍪 Yeni cookie\'ler:', document.cookie);

        // ⚠️ KRITIK KONTROL: Yeni cookie gerçekten geldi mi?
        const hasAccessToken = document.cookie.includes('accessToken');
        if (!hasAccessToken) {
          console.error('⚠️ Token yenileme başarılı ama cookie gelmedi!');
          throw new Error('Token cookie not set after refresh');
        }

        // ✅ Orijinal isteği tekrar dene
        console.log('🔄 Başarısız istek tekrar deneniyor:', originalRequest.url);
        
        // ✅ 100ms bekle (cookie'nin tarayıcıya yazılması için)
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return apiClient(originalRequest);

      } catch (refreshError) {
        console.error('❌ Token yenileme hatası:', refreshError);
        
        // Retry tracker'ı temizle
        retryTracker.delete(requestKey);
        
        // Kullanıcıyı login sayfasına yönlendir
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    // ============================================
    // 🚫 DİĞER HATALAR
    // ============================================
    
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
    });

    return Promise.reject(error);
  }
);

export default apiClient;

/**
 * 💡 PRO TIPS:
 * 
 * 1. withCredentials: true ZORUNLU
 *    - Cookie gönderimi için
 *    - Hem request hem response'da
 * 
 * 2. Retry Counter
 *    - Sonsuz döngüyü engeller
 *    - Map<requestKey, retryCount>
 * 
 * 3. Cookie Kontrol
 *    - Token yenilendikten sonra cookie'nin varlığını kontrol et
 *    - document.cookie.includes('accessToken')
 * 
 * 4. Timing
 *    - Token yenilendikten sonra 100ms bekle
 *    - Cookie'nin tarayıcıya yazılması için
 * 
 * 5. Login Redirect
 *    - Token yenileme başarısız olursa
 *    - window.location.href = '/login'
 */