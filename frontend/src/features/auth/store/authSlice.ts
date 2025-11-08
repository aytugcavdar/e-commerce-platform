// frontend/src/features/auth/store/authSlice.ts

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, User } from '../types/auth.types';
import { loginUser, registerUser, logoutUser, verifyEmail } from './authThunks';

/**
 * 🎓 ÖĞREN: Cookie-Based Authentication
 * 
 * ❌ ÖNCE (localStorage):
 * - Token'ları localStorage'da saklıyorduk
 * - XSS saldırılarına karşı savunmasız
 * - Her istekte manuel ekleme gerekiyordu
 * 
 * ✅ ŞIMDI (Cookie):
 * - Token'lar HttpOnly cookie'lerde saklanıyor (Backend tarafından)
 * - XSS saldırılarına karşı korumalı
 * - Tarayıcı otomatik olarak her istekte gönderiyor
 * - CSRF koruması için SameSite attribute kullanılıyor
 * 
 * 🔥 ÖNEMLİ:
 * Frontend'de artık TOKEN SAKLAMIYORUZ!
 * Sadece kullanıcı bilgilerini (user) ve auth durumunu (isAuthenticated) tutuyoruz.
 */

/**
 * 🏁 INITIAL STATE
 * 
 * Artık token ve refreshToken yok!
 * Cookie'ler backend tarafından yönetiliyor.
 */
const initialState: AuthState = {
  user: null,                    // Kullanıcı bilgileri (Redux Persist'te saklanacak)
  token: null,                   // ❌ KALDIRILDI - Cookie'de saklanıyor
  refreshToken: null,            // ❌ KALDIRILDI - Cookie'de saklanıyor
  isAuthenticated: false,        // Giriş yapılmış mı?
  loading: false,                // API isteği devam ediyor mu?
  error: null,                   // Hata mesajı
  isLoggingIn: false,            // Login isteği yapılıyor mu?
  isRegistering: false,          // Register isteği yapılıyor mu?
  isLoggingOut: false,           // Logout isteği yapılıyor mu?
};

/**
 * 🎯 AUTH SLICE
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  
  reducers: {
    /**
     * 👤 SET USER
     * Kullanıcı bilgilerini günceller
     */
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    
    /**
     * ❌ CLEAR ERROR
     * Hata mesajını temizler
     */
    clearError: (state) => {
      state.error = null;
    },
    
    /**
     * 🚪 LOGOUT
     * Kullanıcıyı çıkış yapar (cookie'ler backend tarafından temizlenecek)
     */
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    
    /**
     * 🔍 CHECK AUTH
     * Sayfa yüklendiğinde auth durumunu kontrol et
     * Backend'den /auth/check endpoint'i ile kullanıcı bilgisi alınacak
     */
    setAuthStatus: (state, action: PayloadAction<{ user: User | null; isAuthenticated: boolean }>) => {
      state.user = action.payload.user;
      state.isAuthenticated = action.payload.isAuthenticated;
    },
  },
  
  extraReducers: (builder) => {
    // ==========================================
    // LOGIN USER
    // ==========================================
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
        state.isAuthenticated = true;
        state.error = null;
        
        // ✅ Cookie'ler backend tarafından set edildi (Set-Cookie header ile)
        // Frontend'de token saklamaya gerek yok!
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoggingIn = false;
        state.loading = false;
        state.error = action.payload as string || 'Giriş yapılırken bir hata oluştu';
      });
    
    // ==========================================
    // REGISTER USER
    // ==========================================
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
        state.isAuthenticated = false; // E-posta doğrulama gerekiyor
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isRegistering = false;
        state.loading = false;
        state.error = action.payload as string || 'Kayıt olurken bir hata oluştu';
      });
    
    // ==========================================
    // LOGOUT USER
    // ==========================================
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoggingOut = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        // Tüm state'i temizle
        return { ...initialState, isLoggingOut: false };
      })
      .addCase(logoutUser.rejected, (state) => {
        // Hata olsa bile çıkış yap
        return { ...initialState, isLoggingOut: false };
      });
    
    // ==========================================
    // VERIFY EMAIL
    // ==========================================
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

export const { setUser, clearError, logout, setAuthStatus } = authSlice.actions;

export default authSlice.reducer;

/**
 * 🎯 KULLANIM ÖRNEĞİ:
 * 
 * // App.tsx - Sayfa yüklendiğinde auth durumunu kontrol et
 * import { useEffect } from 'react';
 * import { useAppDispatch } from '@/app/hooks';
 * import { checkAuth } from '@/features/auth/store/authThunks';
 * 
 * function App() {
 *   const dispatch = useAppDispatch();
 *   
 *   useEffect(() => {
 *     // Backend'e istek at, cookie geçerliyse kullanıcı bilgilerini al
 *     dispatch(checkAuth());
 *   }, [dispatch]);
 *   
 *   return <AppRoutes />;
 * }
 */

/**
 * 💡 PRO TIP: Cookie vs localStorage
 * 
 * ┌─────────────────┬──────────────┬──────────────┐
 * │                 │ localStorage │ Cookie       │
 * ├─────────────────┼──────────────┼──────────────┤
 * │ XSS Güvenliği   │ ❌ Savunmasız │ ✅ HttpOnly   │
 * │ CSRF Güvenliği  │ ✅ İmmune     │ ⚠️ SameSite  │
 * │ Otomatik Gönder │ ❌ Manuel     │ ✅ Otomatik   │
 * │ Boyut Limiti    │ ~5-10MB      │ ~4KB         │
 * │ Erişim          │ JS ile       │ Backend      │
 * └─────────────────┴──────────────┴──────────────┘
 * 
 * 🔥 BEST PRACTICE:
 * - Access Token: HttpOnly Cookie (XSS'den korunur)
 * - Refresh Token: HttpOnly Cookie (XSS'den korunur)
 * - User Data: Redux State (Redux Persist ile localStorage'da - hassas veri yok)
 */

/**
 * 🔥 CSRF (Cross-Site Request Forgery) Koruması:
 * 
 * Backend'de cookie ayarları:
 * - httpOnly: true (JavaScript erişimini engelle)
 * - secure: true (Sadece HTTPS ile gönder - production'da)
 * - sameSite: 'strict' veya 'lax' (CSRF saldırılarını engelle)
 * 
 * Frontend'de yapılacak:
 * - axios.defaults.withCredentials = true (Cookie'leri otomatik gönder)
 */

/**
 * 🎓 ÖĞREN: Redux Persist ile Cookie-Based Auth
 * 
 * Redux Persist sadece kullanıcı bilgilerini saklar:
 * - user: { id, email, firstName, ... }
 * - isAuthenticated: true
 * 
 * Token'lar backend tarafından cookie'lerde saklanır:
 * - accessToken (HttpOnly)
 * - refreshToken (HttpOnly)
 * 
 * Sayfa yenilendiğinde:
 * 1. Redux Persist'ten user bilgisi yüklenir
 * 2. Backend'e checkAuth() isteği atılır (cookie otomatik gönderilir)
 * 3. Cookie geçerliyse -> isAuthenticated: true
 * 4. Cookie geçersizse -> logout() çağrılır
 */