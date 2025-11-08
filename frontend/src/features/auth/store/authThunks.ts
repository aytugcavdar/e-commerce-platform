// frontend/src/features/auth/store/authThunks.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '@/shared/services/api/client';
import { AUTH_ENDPOINTS } from '@/shared/services/api/endpoints';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  VerifyEmailRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '../types/auth.types';

/**
 * 🎓 ÖĞREN: Cookie-Based Thunks
 * 
 * Değişiklikler:
 * 1. ❌ Token'ları artık localStorage'a kaydetmiyoruz
 * 2. ✅ Backend otomatik olarak Set-Cookie header'ı gönderiyor
 * 3. ✅ axios.defaults.withCredentials = true sayesinde cookie'ler otomatik gönderiliyor
 * 4. 🆕 checkAuth() thunk'u eklendi (sayfa yüklendiğinde auth kontrolü)
 */

/**
 * 🔐 LOGIN USER - Kullanıcı Girişi
 * 
 * Backend'den gelen cevap:
 * {
 *   success: true,
 *   message: "Giriş başarılı",
 *   data: {
 *     user: {...}
 *     // ❌ token ve refreshToken artık yok (cookie'lerde)
 *   }
 * }
 * 
 * + Set-Cookie header'ında:
 * - accessToken (HttpOnly, Secure, SameSite=Strict)
 * - refreshToken (HttpOnly, Secure, SameSite=Strict)
 */
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post<LoginResponse>(
        AUTH_ENDPOINTS.LOGIN,
        credentials
      );
      
      // ✅ Cookie'ler otomatik olarak tarayıcı tarafından saklandı!
      // ✅ Bir sonraki isteklerde otomatik olarak gönderilecek!
      
      return data.data; // Sadece user bilgisi
      
    } catch (error: any) {
      const message = 
        error.response?.data?.message || 
        error.message || 
        'Giriş yapılırken bir hata oluştu';
      
      return rejectWithValue(message);
    }
  }
);

/**
 * 📝 REGISTER USER - Kullanıcı Kaydı
 * 
 * E-posta doğrulama linki gönderilir.
 * Kayıt sonrası otomatik giriş yapılmaz.
 */
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterRequest, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('firstName', userData.firstName);
      formData.append('lastName', userData.lastName);
      formData.append('email', userData.email);
      formData.append('password', userData.password);
      
      if (userData.phone) {
        formData.append('phone', userData.phone);
      }
      
      if (userData.avatar) {
        formData.append('avatar', userData.avatar);
      }
      
      const { data } = await apiClient.post<RegisterResponse>(
        AUTH_ENDPOINTS.REGISTER,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      return data.data; // user
      
    } catch (error: any) {
      const message = 
        error.response?.data?.message || 
        error.message || 
        'Kayıt olurken bir hata oluştu';
      
      return rejectWithValue(message);
    }
  }
);

/**
 * 🚪 LOGOUT USER - Çıkış Yap
 * 
 * Backend'e logout isteği gönderir.
 * Backend cookie'leri temizler (Set-Cookie ile boş değer gönderir).
 */
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await apiClient.post(AUTH_ENDPOINTS.LOGOUT);
      
      // ✅ Backend cookie'leri temizledi (expires=Thu, 01 Jan 1970)
      // ❌ Frontend'de localStorage.clear() yapmaya gerek yok
      
      return;
      
    } catch (error: any) {
      // Hata olsa bile çıkış yap (frontend tarafında)
      const message = 
        error.response?.data?.message || 
        'Çıkış yapılırken bir hata oluştu';
      
      return rejectWithValue(message);
    }
  }
);

/**
 * ✅ VERIFY EMAIL - E-posta Doğrula
 */
export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (verifyData: VerifyEmailRequest, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get(AUTH_ENDPOINTS.VERIFY_EMAIL, {
        params: {
          token: verifyData.token,
        },
      });
      
      return data;
      
    } catch (error: any) {
      const message = 
        error.response?.data?.message || 
        'E-posta doğrulanamadı';
      
      return rejectWithValue(message);
    }
  }
);

/**
 * 🔄 RESEND VERIFICATION EMAIL - Doğrulama E-postasını Tekrar Gönder
 */
export const resendVerificationEmail = createAsyncThunk(
  'auth/resendVerificationEmail',
  async (email: string, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post(AUTH_ENDPOINTS.RESEND_VERIFICATION, {
        email,
      });
      
      return data;
      
    } catch (error: any) {
      const message = 
        error.response?.data?.message || 
        'E-posta gönderilemedi';
      
      return rejectWithValue(message);
    }
  }
);

/**
 * 🔑 FORGOT PASSWORD - Şifremi Unuttum
 */
export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (forgotData: ForgotPasswordRequest, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post(
        AUTH_ENDPOINTS.FORGOT_PASSWORD,
        forgotData
      );
      
      return data;
      
    } catch (error: any) {
      const message = 
        error.response?.data?.message || 
        'İstek gönderilemedi';
      
      return rejectWithValue(message);
    }
  }
);

/**
 * 🔄 RESET PASSWORD - Şifre Sıfırla
 */
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (resetData: ResetPasswordRequest, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post(
        AUTH_ENDPOINTS.RESET_PASSWORD,
        {
          email: resetData.email,
          password: resetData.password,
        },
        {
          params: {
            token: resetData.token,
          },
        }
      );
      
      return data;
      
    } catch (error: any) {
      const message = 
        error.response?.data?.message || 
        'Şifre sıfırlanamadı';
      
      return rejectWithValue(message);
    }
  }
);

/**
 * 🆕 CHECK AUTH - Auth Durumunu Kontrol Et
 * 
 * Sayfa yüklendiğinde çağrılır.
 * Cookie'deki token'ı backend'e gönderir (otomatik).
 * Backend token'ı doğrular ve kullanıcı bilgilerini döndürür.
 * 
 * Backend endpoint: GET /api/auth/me
 * 
 * Başarılı cevap:
 * {
 *   success: true,
 *   data: {
 *     user: { id, email, firstName, ... }
 *   }
 * }
 * 
 * Başarısız cevap (401):
 * {
 *   success: false,
 *   message: "Unauthorized"
 * }
 */
export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔍 [checkAuth] Backend\'e istek atılıyor...');
      console.log('🍪 [checkAuth] Mevcut cookie\'ler:', document.cookie);
      
      // Backend'e istek at (cookie otomatik gönderilir)
      const { data } = await apiClient.get('/auth/me');
      
      console.log('✅ [checkAuth] Başarılı response:', data);
      
      return data.data; // { user }
      
    } catch (error: any) {
      console.error('❌ [checkAuth] Hata:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        cookies: document.cookie,
      });
      
      // 401 Unauthorized -> Token geçersiz
      if (error.response?.status === 401) {
        return rejectWithValue('Unauthorized');
      }
      
      const message = 
        error.response?.data?.message || 
        'Auth kontrolü başarısız';
      
      return rejectWithValue(message);
    }
  }
);


/**
 * 🎯 KULLANIM ÖRNEĞİ:
 * 
 * // App.tsx
 * import { useEffect } from 'react';
 * import { useAppDispatch } from '@/app/hooks';
 * import { checkAuth } from '@/features/auth/store/authThunks';
 * import { setAuthStatus } from '@/features/auth/store/authSlice';
 * 
 * function App() {
 *   const dispatch = useAppDispatch();
 *   
 *   useEffect(() => {
 *     const verifyAuth = async () => {
 *       try {
 *         const result = await dispatch(checkAuth()).unwrap();
 *         
 *         // Başarılı -> Kullanıcı giriş yapmış
 *         dispatch(setAuthStatus({
 *           user: result.user,
 *           isAuthenticated: true
 *         }));
 *         
 *       } catch (error) {
 *         // Başarısız -> Cookie geçersiz, logout yap
 *         dispatch(setAuthStatus({
 *           user: null,
 *           isAuthenticated: false
 *         }));
 *       }
 *     };
 *     
 *     verifyAuth();
 *   }, [dispatch]);
 *   
 *   return <AppRoutes />;
 * }
 */

/**
 * 💡 PRO TIP: Token Yenileme
 * 
 * Backend'de refresh token mekanizması varsa:
 * 
 * 1. Access token süresi dolduğunda API 401 döner
 * 2. Axios interceptor devreye girer
 * 3. /api/auth/refresh-token endpoint'ine istek atılır (refresh token cookie'si gönderilir)
 * 4. Backend yeni access token'ı Set-Cookie ile gönderir
 * 5. Başarısız olan istek tekrar denenir
 * 
 * Bu mekanizma shared/services/api/client.ts'de implement edilecek.
 */

/**
 * 🔥 BEST PRACTICE: Error Handling
 * 
 * Backend'den gelen hata tipleri:
 * 
 * 1. 401 Unauthorized:
 *    - Token geçersiz veya süresi dolmuş
 *    - Action: Logout yap, login sayfasına yönlendir
 * 
 * 2. 403 Forbidden:
 *    - Token geçerli ama yetki yok
 *    - Action: Yetkisiz erişim mesajı göster
 * 
 * 3. 400 Bad Request:
 *    - Form validation hatası
 *    - Action: Hata mesajını form'da göster
 * 
 * 4. 500 Internal Server Error:
 *    - Backend hatası
 *    - Action: Genel hata mesajı göster
 */