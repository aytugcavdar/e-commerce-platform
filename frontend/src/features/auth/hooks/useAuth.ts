// frontend/src/features/auth/hooks/useAuth.ts

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useNavigate } from 'react-router-dom';
import {
  loginUser,
  registerUser,
  logoutUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
} from '../store/authThunks';
import { clearError } from '../store/authSlice';
import type {
  LoginRequest,
  RegisterRequest,
  VerifyEmailRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '../types/auth.types';

/**
 * 🎓 ÖĞREN: Custom Hook Nedir?
 * 
 * Custom hook, React logic'ini tekrar kullanılabilir hale getirir.
 * 
 * Neden Custom Hook?
 * - Kod tekrarını önler
 * - Component'leri temiz tutar
 * - Test edilebilir
 * - Okunabilir
 * 
 * Kural:
 * - "use" ile başlamalı (useAuth, useCart, useProducts)
 * - React hooks kullanabilir (useState, useEffect, vb.)
 * - Component'lerde kullanılır
 * 
 * ❌ OLMADAN:
 * const LoginPage = () => {
 *   const dispatch = useAppDispatch();
 *   const { isLoggingIn } = useAppSelector(state => state.auth);
 *   
 *   const handleLogin = async (credentials) => {
 *     const result = await dispatch(loginUser(credentials));
 *     if (loginUser.fulfilled.match(result)) {
 *       navigate('/');
 *     }
 *   };
 *   // ... 20 satır daha
 * };
 * 
 * ✅ İLE:
 * const LoginPage = () => {
 *   const { login, isLoggingIn } = useAuth();
 *   
 *   const handleLogin = async (credentials) => {
 *     await login(credentials);
 *   };
 *   // Çok daha temiz!
 * };
 */

/**
 * 🔐 USE AUTH HOOK
 * 
 * Authentication işlemlerini kolaylaştıran custom hook.
 * Component'lerde direkt kullanılabilir.
 * 
 * @returns Auth state ve fonksiyonları
 */
export const useAuth = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  // Redux state'inden auth verilerini al
  const {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    isLoggingIn,
    isRegistering,
    isLoggingOut,
  } = useAppSelector((state) => state.auth);
  
  /**
   * 🔐 LOGIN - Giriş Yap
   * 
   * E-posta ve şifre ile giriş yapar.
   * Başarılıysa ana sayfaya yönlendirir.
   */
  const login = useCallback(
    async (credentials: LoginRequest) => {
      try {
        const result = await dispatch(loginUser(credentials));
        
        if (loginUser.fulfilled.match(result)) {
          // Başarılı giriş
          navigate('/'); // Ana sayfaya yönlendir
          return { success: true };
        } else {
          // Başarısız giriş
          return { 
            success: false, 
            error: result.payload as string 
          };
        }
      } catch (error) {
        return { 
          success: false, 
          error: 'Beklenmeyen bir hata oluştu' 
        };
      }
    },
    [dispatch, navigate]
  );
  
  /**
   * 📝 REGISTER - Kayıt Ol
   * 
   * Yeni kullanıcı oluşturur.
   * Başarılıysa e-posta doğrulama sayfasına yönlendirir.
   */
  const register = useCallback(
    async (userData: RegisterRequest) => {
      try {
        const result = await dispatch(registerUser(userData));
        
        if (registerUser.fulfilled.match(result)) {
          // Başarılı kayıt
          navigate('/verify-email', {
            state: { email: userData.email }
          });
          return { success: true };
        } else {
          // Başarısız kayıt
          return { 
            success: false, 
            error: result.payload as string 
          };
        }
      } catch (error) {
        return { 
          success: false, 
          error: 'Beklenmeyen bir hata oluştu' 
        };
      }
    },
    [dispatch, navigate]
  );
  
  /**
   * 🚪 LOGOUT - Çıkış Yap
   * 
   * Kullanıcıyı çıkış yapar.
   * Login sayfasına yönlendirir.
   */
  const logout = useCallback(
    async () => {
      try {
        await dispatch(logoutUser());
        navigate('/login');
        return { success: true };
      } catch (error) {
        return { 
          success: false, 
          error: 'Çıkış yapılırken bir hata oluştu' 
        };
      }
    },
    [dispatch, navigate]
  );
  
  /**
   * ✅ VERIFY EMAIL - E-posta Doğrula
   */
  const verify = useCallback(
    async (verifyData: VerifyEmailRequest) => {
      try {
        const result = await dispatch(verifyEmail(verifyData));
        
        if (verifyEmail.fulfilled.match(result)) {
          // Başarılı doğrulama
          navigate('/login', {
            state: { message: 'E-posta doğrulandı! Giriş yapabilirsiniz.' }
          });
          return { success: true };
        } else {
          return { 
            success: false, 
            error: result.payload as string 
          };
        }
      } catch (error) {
        return { 
          success: false, 
          error: 'Beklenmeyen bir hata oluştu' 
        };
      }
    },
    [dispatch, navigate]
  );
  
  /**
   * 🔑 FORGOT PASSWORD - Şifremi Unuttum
   */
  const forgot = useCallback(
    async (forgotData: ForgotPasswordRequest) => {
      try {
        const result = await dispatch(forgotPassword(forgotData));
        
        if (forgotPassword.fulfilled.match(result)) {
          return { 
            success: true, 
            message: 'Şifre sıfırlama linki e-postanıza gönderildi.' 
          };
        } else {
          return { 
            success: false, 
            error: result.payload as string 
          };
        }
      } catch (error) {
        return { 
          success: false, 
          error: 'Beklenmeyen bir hata oluştu' 
        };
      }
    },
    [dispatch]
  );
  
  /**
   * 🔄 RESET PASSWORD - Şifre Sıfırla
   */
  const reset = useCallback(
    async (resetData: ResetPasswordRequest) => {
      try {
        const result = await dispatch(resetPassword(resetData));
        
        if (resetPassword.fulfilled.match(result)) {
          // Başarılı sıfırlama
          navigate('/login', {
            state: { message: 'Şifreniz sıfırlandı! Giriş yapabilirsiniz.' }
          });
          return { success: true };
        } else {
          return { 
            success: false, 
            error: result.payload as string 
          };
        }
      } catch (error) {
        return { 
          success: false, 
          error: 'Beklenmeyen bir hata oluştu' 
        };
      }
    },
    [dispatch, navigate]
  );
  
  /**
   * ❌ CLEAR ERROR - Hata Mesajını Temizle
   */
  const clear = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);
  
  /**
   * 🔒 IS ADMIN - Admin mi?
   */
  const isAdmin = user?.role === 'admin';
  
  /**
   * 🔒 IS SELLER - Satıcı mı?
   */
  const isSeller = user?.role === 'seller';
  
  /**
   * 📧 IS EMAIL VERIFIED - E-posta doğrulandı mı?
   */
  const isEmailVerified = user?.isEmailVerified || false;
  
  // Hook'tan döndürülecek değerler
  return {
    // State
    user,
    token,
    isAuthenticated,
    loading,
    error,
    isLoggingIn,
    isRegistering,
    isLoggingOut,
    
    // Computed values
    isAdmin,
    isSeller,
    isEmailVerified,
    
    // Functions
    login,
    register,
    logout,
    verify,
    forgot,
    reset,
    clearError: clear,
  };
};

/**
 * 🎯 KULLANIM ÖRNEĞİ:
 * 
 * // Component içinde:
 * import { useAuth } from '@/features/auth/hooks/useAuth';
 * 
 * const LoginPage = () => {
 *   const { login, isLoggingIn, error } = useAuth();
 *   
 *   const handleSubmit = async (values) => {
 *     const result = await login(values);
 *     
 *     if (result.success) {
 *       toast.success('Giriş başarılı!');
 *     } else {
 *       toast.error(result.error);
 *     }
 *   };
 *   
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <Input name="email" />
 *       <Input name="password" type="password" />
 *       {error && <p className="error">{error}</p>}
 *       <Button type="submit" isLoading={isLoggingIn}>
 *         Giriş Yap
 *       </Button>
 *     </form>
 *   );
 * };
 * 
 * // Header'da kullanım:
 * const Header = () => {
 *   const { user, isAuthenticated, logout, isAdmin } = useAuth();
 *   
 *   return (
 *     <header>
 *       {isAuthenticated ? (
 *         <>
 *           <p>Merhaba {user?.firstName}</p>
 *           {isAdmin && <Link to="/admin">Admin Panel</Link>}
 *           <button onClick={logout}>Çıkış</button>
 *         </>
 *       ) : (
 *         <Link to="/login">Giriş Yap</Link>
 *       )}
 *     </header>
 *   );
 * };
 */

/**
 * 💡 PRO TIP: useCallback Neden?
 * 
 * useCallback, fonksiyonları memoize eder.
 * Gereksiz re-render'ları önler.
 * 
 * ❌ OLMADAN:
 * const login = async () => { ... }
 * // Her render'da yeni fonksiyon oluşur
 * 
 * ✅ İLE:
 * const login = useCallback(async () => { ... }, [dispatch])
 * // Sadece dispatch değişirse yeni fonksiyon oluşur
 * 
 * Performans artışı!
 */