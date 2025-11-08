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
  withCredentials: true, // ✅ Cookie'leri otomatik gönder
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
        data: config.data,
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
    
    if (response?.status === 401) {
      // 🚫 1. Refresh token endpoint'ine istek atılıyorsa döngüye girme
      if (config?.url?.includes(AUTH_ENDPOINTS.REFRESH_TOKEN)) {
        console.warn('⚠️ Refresh token geçersiz, logout yapılıyor');
        isRefreshing = false;
        processQueue(error);
        
        // Redux store'u temizle ve login'e yönlendir
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // 🚫 2. /auth/me endpoint'ine istek atılıyorsa token yenileme yapma
      // Çünkü bu zaten auth kontrolü için kullanılıyor
      if (config?.url?.includes('/auth/me')) {
        console.warn('⚠️ /auth/me başarısız, token geçersiz');
        return Promise.reject(error);
      }

      // ✅ 3. Token yenileme işlemi devam ediyorsa kuyruğa ekle
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(config!))
          .catch((err) => Promise.reject(err));
      }

      // ✅ 4. Token yenileme işlemini başlat
      isRefreshing = true;

      try {
        console.log('🔄 Token yenileniyor...');
        
        await apiClient.post(AUTH_ENDPOINTS.REFRESH_TOKEN);
        
        console.log('✅ Token yenilendi');
        
        isRefreshing = false;
        processQueue();
        
        // Başarısız olan isteği tekrar dene
        return apiClient(config!);
        
      } catch (refreshError) {
        console.error('❌ Token yenileme başarısız');
        
        isRefreshing = false;
        processQueue(refreshError);
        
        // Login sayfasına yönlendir
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      }
    }

    // Diğer hatalar
    if (response) {
      switch (response.status) {
        case 403:
          console.warn('⚠️ 403 Forbidden');
          break;
        case 404:
          console.warn('⚠️ 404 Not Found:', config?.url);
          break;
        case 500:
        case 502:
        case 503:
          console.error('❌ Server Error:', response.status);
          break;
      }
    } else if (error.code === 'ECONNABORTED') {
      console.error('❌ Request Timeout');
    } else if (error.message === 'Network Error') {
      console.error('❌ Network Error');
    }

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

/**
 * 💡 KULLANIM NOTU:
 * 
 * Bu client artık aşağıdaki endpoint'lerde token yenileme yapmaz:
 * 1. /auth/refresh-token (sonsuz döngü önlenir)
 * 2. /auth/me (auth kontrolü için kullanılır)
 * 
 * Diğer tüm endpoint'lerde 401 alındığında otomatik token yenileme yapılır.
 */