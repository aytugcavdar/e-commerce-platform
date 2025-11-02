// frontend/src/features/auth/store/authSlice.ts

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, User } from '../types/auth.types';
import { env } from '@/config/env';
import { loginUser, registerUser, logoutUser, verifyEmail } from './authThunks';

/**
 * 🎓 ÖĞREN: Redux Slice Nedir?
 * 
 * Slice, Redux state'inin bir parçasıdır (dilimi).
 * 
 * Düşün ki bir pizza:
 * 🍕 Pizza = Tüm state
 * 🍕 Slice = Bir dilim (auth, products, cart)
 * 
 * Her slice:
 * - Kendi state'ini yönetir
 * - Kendi reducer'larını içerir
 * - Kendi action'larını oluşturur
 * 
 * Redux Toolkit'in createSlice() fonksiyonu sayesinde:
 * - Action types otomatik oluşturulur
 * - Reducer'lar basitleştirilir
 * - Immer ile immutable update kolaylaşır
 */

/**
 * 🏁 INITIAL STATE - Başlangıç Durumu
 * 
 * Uygulama ilk açıldığında auth state'i bu değerlere sahip olur.
 * Redux Persist sayesinde localStorage'dan yüklenebilir.
 */
const initialState: AuthState = {
  user: null,                     // Başlangıçta kullanıcı yok
  token: null,                    // Token yok
  refreshToken: null,             // Refresh token yok
  isAuthenticated: false,         // Giriş yapılmamış
  loading: false,                 // Yükleniyor değil
  error: null,                    // Hata yok
  isLoggingIn: false,             // Login işlemi yok
  isRegistering: false,           // Register işlemi yok
  isLoggingOut: false,            // Logout işlemi yok
};

/**
 * 🎯 AUTH SLICE - Redux Slice Tanımı
 */
const authSlice = createSlice({
  name: 'auth',                   // Slice adı (state.auth)
  initialState,                   // Başlangıç state'i
  
  /**
   * 📝 REDUCERS - Senkron State Güncellemeleri
   * 
   * Bu reducer'lar direkt state'i günceller.
   * API çağrısı yapmaz, sadece state manipülasyonu yapar.
   */
  reducers: {
    /**
     * 🔄 SET USER - Kullanıcı bilgisini güncelle
     * 
     * Kullanım: dispatch(setUser(userData))
     */
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    
    /**
     * 🔄 SET TOKEN - Token'ları güncelle
     * 
     * Kullanım: dispatch(setToken({ token, refreshToken }))
     */
    setToken: (state, action: PayloadAction<{ token: string; refreshToken: string }>) => {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      
      // Token'ları localStorage'a kaydet
      localStorage.setItem(env.tokenKey, action.payload.token);
      localStorage.setItem(env.refreshTokenKey, action.payload.refreshToken);
    },
    
    /**
     * ❌ CLEAR ERROR - Hata mesajını temizle
     * 
     * Kullanım: dispatch(clearError())
     */
    clearError: (state) => {
      state.error = null;
    },
    
    /**
     * 🚪 LOGOUT (Senkron) - Çıkış yap
     * 
     * Bu sadece state temizler, API çağrısı yapmaz.
     * API çağrısı için logoutUser thunk'ını kullan.
     */
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      
      // Token'ları localStorage'dan sil
      localStorage.removeItem(env.tokenKey);
      localStorage.removeItem(env.refreshTokenKey);
    },
  },
  
  /**
   * 🔄 EXTRA REDUCERS - Async İşlemler (Thunks)
   * 
   * createAsyncThunk ile oluşturulan async action'ların
   * durumlarını (pending, fulfilled, rejected) dinler.
   * 
   * Her thunk 3 duruma sahiptir:
   * - pending: İşlem devam ediyor (loading: true)
   * - fulfilled: İşlem başarılı (data ile)
   * - rejected: İşlem başarısız (error ile)
   */
  extraReducers: (builder) => {
    /**
     * 🔐 LOGIN USER - Giriş Yap
     */
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
        
        // Token'ları localStorage'a kaydet
        localStorage.setItem(env.tokenKey, action.payload.token);
        localStorage.setItem(env.refreshTokenKey, action.payload.refreshToken);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoggingIn = false;
        state.loading = false;
        state.error = action.payload as string || 'Giriş yapılırken bir hata oluştu';
      });
    
    /**
     * 📝 REGISTER USER - Kayıt Ol
     */
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
        // Kayıtta otomatik giriş yapılmıyor (e-posta doğrulama bekleniyor)
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isRegistering = false;
        state.loading = false;
        state.error = action.payload as string || 'Kayıt olurken bir hata oluştu';
      });
    
    /**
     * 🚪 LOGOUT USER - Çıkış Yap
     */
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoggingOut = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        // State'i sıfırla
        return { ...initialState, isLoggingOut: false };
      })
      .addCase(logoutUser.rejected, (state) => {
        // Hata olsa bile çıkış yap
        return { ...initialState, isLoggingOut: false };
      });
    
    /**
     * ✅ VERIFY EMAIL - E-posta Doğrula
     */
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

/**
 * 📤 EXPORT ACTIONS - Action'ları dışa aktar
 * 
 * Component'lerde kullanmak için:
 * import { setUser, clearError } from '@/features/auth/store/authSlice';
 */
export const { setUser, setToken, clearError, logout } = authSlice.actions;

/**
 * 📤 EXPORT REDUCER - Reducer'ı dışa aktar
 * 
 * rootReducer'a eklemek için:
 * import authReducer from '@/features/auth/store/authSlice';
 */
export default authSlice.reducer;

/**
 * 🎯 KULLANIM ÖRNEKLERİ:
 * 
 * // Component içinde:
 * import { useAppDispatch, useAppSelector } from '@/app/hooks';
 * import { loginUser, clearError } from '@/features/auth/store/authSlice';
 * 
 * const LoginPage = () => {
 *   const dispatch = useAppDispatch();
 *   const { isLoggingIn, error } = useAppSelector((state) => state.auth);
 *   
 *   const handleLogin = async (credentials) => {
 *     await dispatch(loginUser(credentials));
 *   };
 *   
 *   return (
 *     <div>
 *       {error && <p>{error}</p>}
 *       <button onClick={handleLogin} disabled={isLoggingIn}>
 *         {isLoggingIn ? 'Giriş yapılıyor...' : 'Giriş Yap'}
 *       </button>
 *     </div>
 *   );
 * };
 */

/**
 * 💡 PRO TIP: Immer ile Immutability
 * 
 * Redux Toolkit, Immer kütüphanesini kullanır.
 * State'i direkt değiştirebiliriz gibi görünse de aslında immutable!
 * 
 * ✅ Redux Toolkit ile:
 * state.user = action.payload;
 * 
 * ❌ Klasik Redux ile:
 * return {
 *   ...state,
 *   user: action.payload
 * };
 * 
 * Her ikisi de aynı şeyi yapar ama RTK daha temiz!
 */