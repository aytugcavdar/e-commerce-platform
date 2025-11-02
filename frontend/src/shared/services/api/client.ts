// frontend/src/shared/services/api/client.ts

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';

/**
 * 🎓 ÖĞREN: Axios Nedir?
 * 
 * Axios, HTTP istekleri (GET, POST, PUT, DELETE) yapmak için kullanılan
 * popüler bir kütüphanedir.
 * 
 * ❌ fetch() API'sinden FARKLARI:
 * - Otomatik JSON dönüşümü
 * - Request/Response interceptor desteği
 * - Timeout desteği
 * - Daha iyi hata yönetimi
 * - İlerleme takibi (upload/download)
 * 
 * ✅ NEDEN CUSTOM INSTANCE?
 * - Base URL tek yerden yönetilir
 * - Token otomatik eklenir (interceptor)
 * - Hata yönetimi merkezi
 * - Logging yapılabilir
 */

/**
 * 📦 Axios Instance Oluşturma
 * 
 * axios.create() ile özel ayarlara sahip bir instance oluşturuyoruz.
 * Bu instance'ı tüm API çağrılarında kullanacağız.
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiUrl,              // Base URL (örn: http://localhost:3000/api)
  timeout: env.apiTimeout,          // Timeout (30 saniye)
  headers: {
    'Content-Type': 'application/json',   // JSON gönderiyoruz
    'Accept': 'application/json',         // JSON bekliyoruz
  },
  withCredentials: true,            // Cookie'leri otomatik gönder (refresh token için)
});

/**
 * 🎯 REQUEST INTERCEPTOR
 * 
 * Her istek gönderilmeden ÖNCE çalışır.
 * Burada token'ı header'a ekliyoruz.
 * 
 * ÇALIŞMA AKIŞI:
 * 1. API isteği yapılır: apiClient.get('/products')
 * 2. Request interceptor devreye girer
 * 3. Token localStorage'dan okunur
 * 4. Token header'a eklenir
 * 5. İstek gönderilir
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Token'ı localStorage'dan al
    const token = localStorage.getItem(env.tokenKey);
    
    // Token varsa header'a ekle
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Development'ta log
    if (env.isDevelopment) {
      console.log('📤 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
      });
    }
    
    return config;
  },
  (error: AxiosError) => {
    // Request oluşturulurken hata
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

/**
 * 🎯 RESPONSE INTERCEPTOR
 * 
 * Her cevap geldikten SONRA çalışır.
 * Burada hata yönetimi yapıyoruz.
 * 
 * ÇALIŞMA AKIŞI:
 * 1. Backend'den cevap gelir
 * 2. Response interceptor devreye girer
 * 3. Başarılıysa (2xx) direkt döndür
 * 4. Hatalıysa (4xx, 5xx) özel işlemler yap
 *    - 401: Token geçersiz -> Logout yap
 *    - 403: Yetkisiz -> Ana sayfaya yönlendir
 *    - 500: Server hatası -> Hata mesajı göster
 */
apiClient.interceptors.response.use(
  (response) => {
    // Başarılı response (2xx)
    if (env.isDevelopment) {
      console.log('📥 API Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data,
      });
    }
    
    return response;
  },
  async (error: AxiosError) => {
    // Hatalı response (4xx, 5xx)
    const { response, config } = error;
    
    if (response) {
      switch (response.status) {
        case 401:
          // 🔐 Unauthorized - Token geçersiz veya süresi dolmuş
          console.warn('⚠️ 401 Unauthorized: Token geçersiz');
          
          // Token'ları temizle
          localStorage.removeItem(env.tokenKey);
          localStorage.removeItem(env.refreshTokenKey);
          
          // Login sayfasına yönlendir
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          break;
          
        case 403:
          // 🚫 Forbidden - Yetki yok
          console.warn('⚠️ 403 Forbidden: Bu işlem için yetkiniz yok');
          break;
          
        case 404:
          // 🔍 Not Found - Kaynak bulunamadı
          console.warn('⚠️ 404 Not Found:', config?.url);
          break;
          
        case 500:
        case 502:
        case 503:
          // 💥 Server Error - Backend hatası
          console.error('❌ Server Error:', response.status);
          break;
      }
    } else if (error.code === 'ECONNABORTED') {
      // ⏱️ Timeout
      console.error('❌ Request Timeout');
    } else if (error.message === 'Network Error') {
      // 🌐 Network Error - İnternet yok
      console.error('❌ Network Error: İnternet bağlantınızı kontrol edin');
    }
    
    // Development'ta detaylı log
    if (env.isDevelopment) {
      console.error('❌ API Error:', {
        url: config?.url,
        method: config?.method,
        status: response?.status,
        message: error.message,
        data: response?.data,
      });
    }
    
    return Promise.reject(error);
  }
);

/**
 * 🎯 KULLANIM ÖRNEKLERİ:
 * 
 * // GET isteği
 * const { data } = await apiClient.get('/products');
 * 
 * // POST isteği
 * const { data } = await apiClient.post('/auth/login', {
 *   email: 'user@example.com',
 *   password: '123456'
 * });
 * 
 * // PUT isteği
 * const { data } = await apiClient.put('/users/123', {
 *   firstName: 'Ahmet'
 * });
 * 
 * // DELETE isteği
 * const { data } = await apiClient.delete('/products/123');
 * 
 * // Query parametreleri
 * const { data } = await apiClient.get('/products', {
 *   params: {
 *     category: 'electronics',
 *     page: 1,
 *     limit: 20
 *   }
 * });
 * // URL: /products?category=electronics&page=1&limit=20
 * 
 * // Custom headers
 * const { data } = await apiClient.post('/upload', formData, {
 *   headers: {
 *     'Content-Type': 'multipart/form-data'
 *   }
 * });
 */

/**
 * 💡 PRO TIP: Error Handling
 * 
 * Component'te try-catch kullan:
 * 
 * const handleLogin = async () => {
 *   try {
 *     const { data } = await apiClient.post('/auth/login', credentials);
 *     // Başarılı
 *     toast.success('Giriş başarılı!');
 *   } catch (error) {
 *     // Hata
 *     if (axios.isAxiosError(error)) {
 *       const message = error.response?.data?.message || 'Bir hata oluştu';
 *       toast.error(message);
 *     }
 *   }
 * };
 */

export default apiClient;