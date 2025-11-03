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
 * 🎓 ÖĞREN: Redux Thunk Nedir?
 * 
 * Thunk, async (asenkron) işlemler için kullanılır.
 * API çağrıları, veritabanı işlemleri gibi.
 * 
 * Neden Thunk?
 * - Reducer'lar senkrondur, async işlem yapamazlar
 * - API çağrısı yapmak için async/await gerekir
 * - Thunk bu sorunu çözer
 * 
 * createAsyncThunk() 3 action oluşturur:
 * - pending: İşlem başladı (loading: true)
 * - fulfilled: İşlem başarılı (data ile)
 * - rejected: İşlem başarısız (error ile)
 * 
 * Örnek:
 * dispatch(loginUser(credentials))
 * 1. loginUser.pending -> isLoggingIn: true
 * 2. API çağrısı yapılır
 * 3. loginUser.fulfilled -> user set edilir
 */

/**
 * 🔐 LOGIN USER - Kullanıcı Girişi
 * 
 * E-posta ve şifre ile giriş yapar.
 * Başarılı olursa kullanıcı bilgileri ve token'lar döner.
 * 
 * @param credentials - Email ve password
 * @returns User, token, refreshToken
 */
export const loginUser = createAsyncThunk(
  'auth/login',                   // Action tipi (otomatik: auth/login/pending, fulfilled, rejected)
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      // API çağrısı yap
      const { data } = await apiClient.post<LoginResponse>(
        AUTH_ENDPOINTS.LOGIN,
        credentials
      );
      
      // Backend'den gelen cevap yapısı:
      // {
      //   success: true,
      //   message: "Giriş başarılı",
      //   data: {
      //     user: {...},
      //     token: "eyJhbG...",
      //     refreshToken: "eyJhbG..."
      //   }
      // }
      
      return data.data; // user, token, refreshToken
      
    } catch (error: any) {
      // Hata yönetimi
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
 * Yeni kullanıcı oluşturur.
 * E-posta doğrulama linki gönderilir.
 * 
 * @param userData - Kayıt bilgileri
 * @returns Oluşturulan kullanıcı
 */
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterRequest, { rejectWithValue }) => {
    try {
      // FormData oluştur (avatar upload için)
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
      
      // API çağrısı yap
      const { data } = await apiClient.post<RegisterResponse>(
        AUTH_ENDPOINTS.REGISTER,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data', // Dosya upload için
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
 * Kullanıcıyı çıkış yapar.
 * Backend'e logout isteği gönderir (refresh token'ı iptal eder).
 * 
 * @returns void
 */
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // API çağrısı yap (opsiyonel)
      await apiClient.post(AUTH_ENDPOINTS.LOGOUT);
      
      // Token'ları localStorage'dan sil
      localStorage.clear(); // Tüm storage'ı temizle
      
      return;
      
    } catch (error: any) {
      // Hata olsa bile çıkış yap (frontend tarafında)
      localStorage.clear();
      
      const message = 
        error.response?.data?.message || 
        'Çıkış yapılırken bir hata oluştu';
      
      return rejectWithValue(message);
    }
  }
);

/**
 * ✅ VERIFY EMAIL - E-posta Doğrula
 * 
 * E-posta doğrulama linkine tıklandığında çağrılır.
 * Token'ı backend'e gönderir, e-posta doğrulanır.
 * 
 * @param verifyData - Token ve email
 * @returns void
 */
export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (verifyData: VerifyEmailRequest, { rejectWithValue }) => {
    try {
      // API çağrısı yap (GET request, query params)
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
 * 
 * E-posta doğrulama linki süresi dolduysa veya gelmemişse
 * yeniden gönderir.
 * 
 * @param email - E-posta adresi
 * @returns void
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
 * 
 * Şifre sıfırlama linki e-postaya gönderilir.
 * 
 * @param forgotData - E-posta
 * @returns void
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
 * 
 * Şifre sıfırlama linkine tıklandığında,
 * yeni şifre ile güncelleme yapar.
 * 
 * @param resetData - Token, email, yeni şifre
 * @returns void
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
 * 🔄 REFRESH TOKEN - Token Yenile
 * 
 * Access token süresi dolduğunda,
 * refresh token ile yeni token alır.
 * 
 * @returns Yeni token'lar
 */
export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post(AUTH_ENDPOINTS.REFRESH_TOKEN);
      
      return data.data; // token, refreshToken
      
    } catch (error: any) {
      const message = 
        error.response?.data?.message || 
        'Token yenilenemedi';
      
      // Token yenileme başarısız -> Logout yap
      localStorage.clear();
      window.location.href = '/login';
      
      return rejectWithValue(message);
    }
  }
);

/**
 * 🎯 KULLANIM ÖRNEKLERİ:
 * 
 * // Component içinde:
 * import { useAppDispatch } from '@/app/hooks';
 * import { loginUser, registerUser } from '@/features/auth/store/authThunks';
 * 
 * const LoginPage = () => {
 *   const dispatch = useAppDispatch();
 *   
 *   const handleLogin = async (credentials) => {
 *     // Thunk'ı dispatch et
 *     const result = await dispatch(loginUser(credentials));
 *     
 *     // Sonucu kontrol et
 *     if (loginUser.fulfilled.match(result)) {
 *       // Başarılı
 *       toast.success('Giriş başarılı!');
 *       navigate('/');
 *     } else {
 *       // Başarısız
 *       toast.error(result.payload as string);
 *     }
 *   };
 *   
 *   return <LoginForm onSubmit={handleLogin} />;
 * };
 */

/**
 * 💡 PRO TIP: Error Handling
 * 
 * Thunk'lar her zaman try-catch kullanmalı!
 * 
 * ✅ DOĞRU:
 * try {
 *   const { data } = await apiClient.post(...);
 *   return data;
 * } catch (error) {
 *   return rejectWithValue(error.message);
 * }
 * 
 * ❌ YANLIŞ:
 * const { data } = await apiClient.post(...);
 * return data;
 * // Hata olursa? Uygulama çöker!
 */

/**
 * 🔥 BEST PRACTICE: Loading States
 * 
 * Her thunk için ayrı loading state tutabilirsin:
 * 
 * isLoggingIn: loginUser.pending
 * isRegistering: registerUser.pending
 * isLoggingOut: logoutUser.pending
 * 
 * Bu sayede:
 * - Login butonu loading gösterir: isLoggingIn
 * - Register butonu loading gösterir: isRegistering
 * - Logout butonu loading gösterir: isLoggingOut
 * 
 * Aynı anda birden fazla işlem yapılabilir!
 */