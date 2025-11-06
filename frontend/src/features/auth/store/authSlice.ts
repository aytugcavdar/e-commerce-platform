// frontend/src/features/auth/store/authSlice.ts

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, User } from '../types/auth.types';
import { env } from '@/config/env';
import { loginUser, registerUser, logoutUser, verifyEmail } from './authThunks';

/**
 * 🔧 TOKEN DOĞRULAMA HELPER
 * 
 * JWT token'ın süresi dolmuş mu kontrol eder.
 */
const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  
  // 🔥 DÜZELTME: Token'ın geçerli bir JWT formatında (en az 2 nokta) olup olmadığını kontrol et.
  const parts = token.split('.');
  if (parts.length < 3) {
    console.error('❌ Token formatı hatalı (nokta sayısı eksik)');
    return true;
  }
  
  try {
    // JWT token'ı decode et (payload kısmı)
    const base64Url = parts[1]; // Düzeltildi
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // ... (kodun geri kalanı aynı)
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const payload = JSON.parse(jsonPayload);
    
    // Token'ın exp (expiration) alanını kontrol et
    if (!payload.exp) return true;
    
    // Şu anki zaman (saniye cinsinden)
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Token süresi dolmuş mu?
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Token decode hatası:', error);
    return true;
  }
};

/**
 * 🏁 INITIAL STATE - Başlangıç Durumu
 * 
 * Redux Persist'ten state yüklendiğinde token kontrolü yap.
 */
const getInitialState = (): AuthState => {
  // LocalStorage'dan token al
  const token = localStorage.getItem(env.tokenKey);
  const userStr = localStorage.getItem('persist:root');
  
  // Token varsa ve geçerliyse authenticated tut
  if (token && !isTokenExpired(token)) {
    return {
      user: null, // User Redux persist'ten yüklenecek
      token,
      refreshToken: localStorage.getItem(env.refreshTokenKey),
      isAuthenticated: true,
      loading: false,
      error: null,
      isLoggingIn: false,
      isRegistering: false,
      isLoggingOut: false,
    };
  }
  
  // Token yoksa veya süresi dolmuşsa temiz state
  return {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    isLoggingIn: false,
    isRegistering: false,
    isLoggingOut: false,
  };
};

const initialState: AuthState = getInitialState();

/**
 * 🎯 AUTH SLICE
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    
    setToken: (state, action: PayloadAction<{ token: string; refreshToken: string }>) => {
      // Token süresi dolmamışsa kaydet
      if (!isTokenExpired(action.payload.token)) {
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        
        localStorage.setItem(env.tokenKey, action.payload.token);
        localStorage.setItem(env.refreshTokenKey, action.payload.refreshToken);
      } else {
        // Token süresi dolmuşsa temizle
        console.warn('⚠️ Token süresi dolmuş, temizleniyor...');
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        
        localStorage.removeItem(env.tokenKey);
        localStorage.removeItem(env.refreshTokenKey);
      }
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      
      localStorage.removeItem(env.tokenKey);
      localStorage.removeItem(env.refreshTokenKey);
    },
    
    /**
     * 🆕 CHECK TOKEN VALIDITY
     * 
     * Uygulama başlatıldığında token'ı kontrol et.
     * Süre dolmuşsa logout yap.
     */
    checkTokenValidity: (state) => {
      if (state.token && isTokenExpired(state.token)) {
        console.warn('⚠️ Token süresi dolmuş, kullanıcı çıkartılıyor...');
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = 'Oturumunuz sona erdi. Lütfen tekrar giriş yapın.';
        
        localStorage.removeItem(env.tokenKey);
        localStorage.removeItem(env.refreshTokenKey);
      }
    },
  },
  
  extraReducers: (builder) => {
    // LOGIN USER
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoggingIn = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoggingIn = false;
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
        
        localStorage.setItem(env.tokenKey, action.payload.token);
        localStorage.setItem(env.refreshTokenKey, action.payload.refreshToken);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoggingIn = false;
        state.loading = false;
        state.error = action.payload as string || 'Giriş yapılırken bir hata oluştu';
      });
    
    // REGISTER USER
    builder
      .addCase(registerUser.pending, (state) => {
        state.isRegistering = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isRegistering = false;
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isRegistering = false;
        state.loading = false;
        state.error = action.payload as string || 'Kayıt olurken bir hata oluştu';
      });
    
    // LOGOUT USER
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoggingOut = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        return { ...initialState, isLoggingOut: false };
      })
      .addCase(logoutUser.rejected, (state) => {
        return { ...initialState, isLoggingOut: false };
      });
    
    // VERIFY EMAIL
    builder
      .addCase(verifyEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state) => {
        state.loading = false;
        if (state.user) {
          state.user.isEmailVerified = true;
        }
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'E-posta doğrulanamadı';
      });
  },
});

export const { setUser, setToken, clearError, logout, checkTokenValidity } = authSlice.actions;

export default authSlice.reducer;

/**
 * 💡 KULLANIM ÖRNEĞİ (App.tsx veya index.tsx):
 * 
 * import { useAppDispatch } from '@/app/hooks';
 * import { checkTokenValidity } from '@/features/auth/store/authSlice';
 * 
 * function App() {
 *   const dispatch = useAppDispatch();
 *   
 *   useEffect(() => {
 *     // Uygulama başlatıldığında token'ı kontrol et
 *     dispatch(checkTokenValidity());
 *   }, [dispatch]);
 *   
 *   return <AppRoutes />;
 * }
 */

/**
 * 🔥 BEST PRACTICE: Token Refresh
 * 
 * Token süresi dolmadan önce yenile (5 dakika kala):
 * 
 * const REFRESH_BEFORE_EXPIRY = 5 * 60 * 1000; // 5 dakika
 * 
 * setInterval(() => {
 *   const token = localStorage.getItem(env.tokenKey);
 *   if (token && !isTokenExpired(token)) {
 *     const payload = JSON.parse(atob(token.split('.')[1]));
 *     const expiresIn = (payload.exp * 1000) - Date.now();
 *     
 *     if (expiresIn < REFRESH_BEFORE_EXPIRY) {
 *       dispatch(refreshToken());
 *     }
 *   }
 * }, 60000); // Her dakika kontrol et
 */