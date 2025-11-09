// frontend/src/shared/services/api/client.ts

import axios from 'axios';
import type { 
  AxiosInstance, 
  AxiosError, 
  InternalAxiosRequestConfig 
} from 'axios';
import { env } from '@/config/env';
import { AUTH_ENDPOINTS } from './endpoints';

const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiUrl,
  timeout: env.apiTimeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // ✅ ZORUNLU: Cookie'leri gönder ve al
});

/**
 * 🎯 REQUEST INTERCEPTOR
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (env.isDevelopment) {
      console.log('📤 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        withCredentials: config.withCredentials,
        cookies: document.cookie, 
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
 */
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

// ✅ YENİ: Maksimum retry sayısı
let refreshRetryCount = 0;
const MAX_REFRESH_RETRIES = 1; // Sadece 1 kez dene

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
    // ✅ Başarılı istek, retry sayacını sıfırla
    refreshRetryCount = 0;
    
    if (env.isDevelopment) {
      console.log('📥 API Response:', {
        url: response.config.url,
        status: response.status,
        cookies: document.cookie,
      });
    }
    return response;
  },
  async (error: AxiosError) => {
    const { response, config } = error;
    
    if (response?.status === 401) {
      // 🚫 1. Refresh token endpoint'ine istek atılıyorsa döngüye girme
      if (config?.url?.includes(AUTH_ENDPOINTS.REFRESH_TOKEN)) {
        console.error('❌ Refresh token geçersiz, logout yapılıyor');
        isRefreshing = false;
        refreshRetryCount = 0; // ✅ Sıfırla
        processQueue(error);
        
        // Redux store'u temizle
        window.dispatchEvent(new Event('auth:logout'));
        
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // 🚫 2. /auth/me endpoint'ine istek atılıyorsa token yenileme yapma
      if (config?.url?.includes('/auth/me')) {
        console.warn('⚠️ /auth/me başarısız, token geçersiz');
        return Promise.reject(error);
      }

      // 🚫 3. Maksimum retry sayısına ulaşıldıysa döngüyü kır
      if (refreshRetryCount >= MAX_REFRESH_RETRIES) {
        console.error('❌ Token yenileme maksimum deneme sayısına ulaştı, logout yapılıyor');
        isRefreshing = false;
        refreshRetryCount = 0;
        processQueue(error);
        
        window.dispatchEvent(new Event('auth:logout'));
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // ✅ 4. Token yenileme işlemi devam ediyorsa kuyruğa ekle
      if (isRefreshing) {
        console.log('⏳ Token yenileniyor, istek kuyruğa eklendi');
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            console.log('✅ Token yenilendi, istek tekrar deneniyor');
            return apiClient(config!);
          })
          .catch((err) => {
            console.error('❌ Kuyruktaki istek başarısız:', err);
            return Promise.reject(err);
          });
      }

      // ✅ 5. Token yenileme işlemini başlat
      isRefreshing = true;
      refreshRetryCount++; // ✅ Sayacı artır

      try {
        console.log(`🔄 Token yenileniyor (Deneme ${refreshRetryCount}/${MAX_REFRESH_RETRIES})...`);
        console.log('🍪 Mevcut cookie\'ler:', document.cookie.substring(0, 100));
        
        // ✅ Refresh token isteği
        const refreshResponse = await apiClient.post(AUTH_ENDPOINTS.REFRESH_TOKEN);
        
        console.log('✅ Token yenilendi, yeni cookie\'ler alındı');
        console.log('🍪 Yeni cookie\'ler:', document.cookie.substring(0, 100));
        
        isRefreshing = false;
        refreshRetryCount = 0; // ✅ Başarılı, sıfırla
        processQueue();
        
        // Başarısız olan isteği tekrar dene
        console.log('🔄 Başarısız istek tekrar deneniyor:', config?.url);
        return apiClient(config!);
        
      } catch (refreshError: any) {
        console.error('❌ Token yenileme başarısız:', {
          status: refreshError.response?.status,
          message: refreshError.response?.data?.message,
          cookies: document.cookie,
        });
        
        isRefreshing = false;
        refreshRetryCount = 0; // ✅ Sıfırla
        processQueue(refreshError);
        
        // Redux store'u temizle
        window.dispatchEvent(new Event('auth:logout'));
        
        // Login sayfasına yönlendir
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      }
    }

    // Diğer hatalar
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

export default apiClient;