// frontend/src/features/auth/pages/LoginPage.tsx

import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import LoginForm from '../components/LoginForm';
import { useAuth } from '../hooks/useAuth';
import type { LoginFormData } from '../utils/validation';

/**
 * 🎓 ÖĞREN: Page Component Nedir?
 * 
 * Page component, bir route'a karşılık gelen tam sayfa bileşenidir.
 * 
 * Sorumlulukları:
 * - Layout düzenleme
 * - Data fetching (useEffect)
 * - Form submit handling
 * - Navigation yönetimi
 * - Toast mesajları
 * 
 * Component vs Page:
 * - Component: Tekrar kullanılabilir parçalar (LoginForm)
 * - Page: Route'a özel, tekil sayfalar (LoginPage)
 */

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoggingIn, error, clearError } = useAuth();

  /**
   * 📍 LOCATION STATE
   * 
   * Başka sayfadan yönlendirildiysek mesaj varsa göster.
   * Örnek: E-posta doğrulandı -> Login'e yönlendirildi
   */
  const message = location.state?.message;
  const from = location.state?.from?.pathname || '/';

  /**
   * 🎉 SUCCESS MESSAGE
   * 
   * Sayfa açıldığında location state'inde mesaj varsa göster
   */
  useEffect(() => {
    if (message) {
      toast.success(message);
      // State'i temizle (back tuşuna basınca tekrar göstermesin)
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [message, navigate, location.pathname]);

  /**
   * ❌ CLEAR ERROR ON UNMOUNT
   * 
   * Sayfa kapanınca hata mesajını temizle
   */
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  /**
   * 📝 HANDLE LOGIN SUBMIT
   * 
   * Form submit edildiğinde çağrılır.
   * useAuth hook'u ile login yapar.
   */
  const handleLogin = async (data: LoginFormData) => {
    const result = await login(data);

    if (result.success) {
      toast.success('Giriş başarılı! Hoş geldiniz 🎉');
      // Kullanıcının geldiği sayfaya yönlendir veya ana sayfaya
      navigate(from, { replace: true });
    } else {
      toast.error(result.error || 'Giriş yapılırken bir hata oluştu');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full">
        <LoginForm
          onSubmit={handleLogin}
          isLoading={isLoggingIn}
          error={error}
        />
      </div>
    </div>
  );
};

export default LoginPage;

/**
 * 🎯 KULLANIM SENARYOLARI:
 * 
 * 1. Normal Giriş:
 *    - /login'e git
 *    - Form doldur
 *    - Submit
 *    - Başarılı -> / (ana sayfa)
 * 
 * 2. Protected Route'tan Yönlendirme:
 *    - /profile'e git (login olmadan)
 *    - ProtectedRoute /login'e yönlendirir
 *    - from="/profile" state'i ile
 *    - Login yap -> /profile'e geri dön
 * 
 * 3. E-posta Doğrulama Sonrası:
 *    - E-posta doğrula
 *    - /login'e yönlendir
 *    - message="E-posta doğrulandı" state'i ile
 *    - Toast göster
 * 
 * 4. Şifre Sıfırlama Sonrası:
 *    - Şifre sıfırla
 *    - /login'e yönlendir
 *    - message="Şifre sıfırlandı" state'i ile
 *    - Toast göster
 */

/**
 * 💡 PRO TIP: Location State
 * 
 * navigate() ile state gönderilebilir:
 * 
 * // Gönderen sayfa:
 * navigate('/login', {
 *   state: {
 *     from: location,
 *     message: 'Lütfen giriş yapın'
 *   }
 * });
 * 
 * // Alan sayfa:
 * const location = useLocation();
 * const from = location.state?.from;
 * const message = location.state?.message;
 */

/**
 * 🔥 BEST PRACTICE: Error Handling
 * 
 * 3 seviyede hata yönetimi:
 * 
 * 1. Form Validation Error:
 *    - Yup schema ile
 *    - Field bazlı göster
 * 
 * 2. API Error:
 *    - Backend'den gelen
 *    - Global error state'inde
 *    - Form üstünde göster
 * 
 * 3. Network Error:
 *    - Axios interceptor'da yakala
 *    - Toast ile göster
 * 
 * Her seviyeyi ayrı yönet!
 */

/**
 * 🎨 CSS ANIMATION:
 * 
 * tailwind.config.js'e ekle:
 * 
 * module.exports = {
 *   theme: {
 *     extend: {
 *       animation: {
 *         blob: "blob 7s infinite",
 *       },
 *       keyframes: {
 *         blob: {
 *           "0%": {
 *             transform: "translate(0px, 0px) scale(1)",
 *           },
 *           "33%": {
 *             transform: "translate(30px, -50px) scale(1.1)",
 *           },
 *           "66%": {
 *             transform: "translate(-20px, 20px) scale(0.9)",
 *           },
 *           "100%": {
 *             transform: "translate(0px, 0px) scale(1)",
 *           },
 *         },
 *       },
 *     },
 *   },
 * }
 */