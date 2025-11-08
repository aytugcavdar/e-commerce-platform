// frontend/src/shared/services/api/client.ts

import axios from 'axios';
import type { 
  AxiosInstance, 
  AxiosError, 
  InternalAxiosRequestConfig 
} from 'axios';
import { env } from '@/config/env';
import { AUTH_ENDPOINTS } from './endpoints';

/**
 * 🎓 ÖĞREN: Cookie-Based Axios Client
 * 
 * Değişiklikler:
 * 1. ✅ withCredentials: true (Cookie'leri otomatik gönder)
 * 2. ❌ Authorization header'ı manuel ekleme (artık gerek yok)
 * 3. 🆕 Token yenileme mekanizması (interceptor ile)
 */

/**
 * 📦 Axios Instance Oluşturma
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiUrl,              // Base URL
  timeout: env.apiTimeout,          // Timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,            // ✅ ÖNEMLİ: Cookie'leri otomatik gönder!
});

/**
 * 🎯 REQUEST INTERCEPTOR
 * 
 * Cookie-based auth'ta Authorization header'ı manuel eklemeye gerek yok!
 * Cookie'ler tarayıcı tarafından otomatik gönderiliyor.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // ❌ ARTIK BUNA GEREK YOK:
    // const token = localStorage.getItem(env.tokenKey);
    // if (token && config.headers) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    
    // ✅ Cookie'ler withCredentials: true sayesinde otomatik gönderiliyor!
    
    // Development'ta log
    if (env.isDevelopment) {
      console.log('📤 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
        // Cookie'ler tarayıcı tarafından gönderiliyor (console'da görünmez)
      });
    }
    
    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

/**
 * 🎯 RESPONSE INTERCEPTOR
 * 
 * Hata yönetimi ve token yenileme mekanizması.
 */
let isRefreshing = false; // Token yenileme devam ediyor mu?
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = []; // Bekleyen istekler

/**
 * 🔄 Bekleyen istekleri işle
 */
const processQueue = (error: any = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });
  
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    // Başarılı response
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
    const { response, config } = error;
    
    if (response) {
      switch (response.status) {
        case 401: {
          // 🔐 Unauthorized - Token geçersiz
          
          // Refresh token endpoint'ine istek atılıyorsa, döngüye girme
          if (config?.url?.includes(AUTH_ENDPOINTS.REFRESH_TOKEN)) {
            console.warn('⚠️ 401: Refresh token da geçersiz, logout yap');
            
            // Logout yap
            window.location.href = '/login';
            return Promise.reject(error);
          }
          
          // Token yenileme işlemi devam ediyorsa, kuyruğa ekle
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then(() => {
                // Token yenilendikten sonra isteği tekrar dene
                return apiClient(config!);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }
          
          // Token yenileme işlemini başlat
          isRefreshing = true;
          
          try {
            console.log('🔄 Token yenileniyor...');
            
            // Refresh token endpoint'ine istek at
            await apiClient.post(AUTH_ENDPOINTS.REFRESH_TOKEN);
            
            // ✅ Backend yeni access token'ı Set-Cookie ile gönderdi!
            // ✅ Cookie otomatik olarak tarayıcıya kaydedildi!
            
            console.log('✅ Token yenilendi');
            
            // Bekleyen istekleri işle
            processQueue();
            
            // Başarısız olan isteği tekrar dene
            return apiClient(config!);
            
          } catch (refreshError) {
            // Refresh token da geçersiz, logout yap
            console.error('❌ Token yenileme başarısız, logout yap');
            
            processQueue(refreshError);
            
            // Login sayfasına yönlendir
            window.location.href = '/login';
            
            return Promise.reject(refreshError);
            
          } finally {
            isRefreshing = false;
          }
        }
          
        case 403:
          // 🚫 Forbidden - Yetki yok
          console.warn('⚠️ 403 Forbidden: Bu işlem için yetkiniz yok');
          break;
          
        case 404:
          // 🔍 Not Found
          console.warn('⚠️ 404 Not Found:', config?.url);
          break;
          
        case 500:
        case 502:
        case 503:
          // 💥 Server Error
          console.error('❌ Server Error:', response.status);
          break;
      }
    } else if (error.code === 'ECONNABORTED') {
      // ⏱️ Timeout
      console.error('❌ Request Timeout');
    } else if (error.message === 'Network Error') {
      // 🌐 Network Error
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
 * // Cookie otomatik gönderildi!
 * 
 * // POST isteği
 * const { data } = await apiClient.post('/auth/login', {
 *   email: 'user@example.com',
 *   password: '123456'
 * });
 * // Backend Set-Cookie header'ı ile cookie'leri set etti!
 * 
 * // Logout
 * await apiClient.post('/auth/logout');
 * // Backend cookie'leri temizledi (expires=Thu, 01 Jan 1970)!
 */

export default apiClient;

/**
 * 💡 PRO TIP: CORS Ayarları
 * 
 * Backend'de CORS ayarları şöyle olmalı:
 * 
 * app.use(cors({
 *   origin: 'http://localhost:5173', // Frontend URL
 *   credentials: true,                // ✅ ÖNEMLİ: Cookie'lere izin ver
 * }));
 * 
 * Frontend'de axios.defaults.withCredentials = true olmalı.
 * Bu sayede tarayıcı cookie'leri otomatik gönderir.
 */

/**
 * 🔥 BEST PRACTICE: Token Yenileme Mekanizması
 * 
 * Akış:
 * 1. API isteği 401 döner (Access token süresi dolmuş)
 * 2. Response interceptor devreye girer
 * 3. /api/auth/refresh-token endpoint'ine istek atılır
 * 4. Backend refresh token cookie'sini kontrol eder
 * 5. Geçerliyse yeni access token'ı Set-Cookie ile gönderir
 * 6. Başarısız olan istek tekrar denenir
 * 7. Kullanıcı hiçbir şey fark etmez!
 * 
 * Refresh token da geçersizse:
 * 1. Logout endpoint'i çağrılır
 * 2. Cookie'ler temizlenir
 * 3. Login sayfasına yönlendirilir
 */

/**
 * 🎓 ÖĞREN: Token Yenileme Kuyruğu
 * 
 * Neden kuyruk gerekli?
 * 
 * Senaryo:
 * 1. 3 API isteği aynı anda atıldı
 * 2. Hepsi 401 döndü (access token süresi dolmuş)
 * 3. Kuyruk olmasaydı 3 kere refresh token isteği atılırdı! ❌
 * 
 * Kuyruk ile:
 * 1. İlk istek refresh token'ı tetikler
 * 2. Diğer istekler kuyruğa eklenir
 * 3. Refresh tamamlanınca kuyruk işlenir
 * 4. Tüm istekler yeni token ile tekrar denenir ✅
 * 
 * Performans ve güvenlik açısından çok önemli!
 */