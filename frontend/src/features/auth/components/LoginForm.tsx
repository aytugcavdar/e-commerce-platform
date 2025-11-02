// frontend/src/features/auth/components/LoginForm.tsx

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Link } from 'react-router-dom';
import { loginSchema, type LoginFormData } from '../utils/validation';
import { Button, Input } from '@/shared/components/ui/base';

/**
 * 🎓 ÖĞREN: React Hook Form Nedir?
 * 
 * React Hook Form, performanslı form yönetimi kütüphanesidir.
 * 
 * Neden React Hook Form?
 * ✅ Performans - Re-render'ları minimize eder
 * ✅ Kolay API - useForm hook'u ile basit kullanım
 * ✅ Validation - Yup, Zod, Joi ile entegrasyon
 * ✅ TypeScript - Tam tip desteği
 * ✅ Küçük bundle size - ~9KB
 * 
 * Alternatifler:
 * - Formik (Daha büyük, daha fazla re-render)
 * - Redux Form (Karmaşık, deprecated)
 * - Final Form (İyi ama daha az popüler)
 * 
 * Temel Kavramlar:
 * - register: Input'u form'a kaydet
 * - handleSubmit: Form submit'i yönet
 * - formState: Form durumu (errors, isValid vb.)
 * - watch: Input değerlerini izle
 * - setValue: Input değerini değiştir
 * - reset: Form'u sıfırla
 */

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => void | Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

const LoginForm = ({ onSubmit, isLoading = false, error }: LoginFormProps) => {
  /**
   * 🎯 USE FORM HOOK
   * 
   * Form state ve fonksiyonlarını sağlar.
   */
  const {
    register,           // Input'u form'a kaydet
    handleSubmit,       // Submit handler'ı
    formState: { errors, isValid },  // Form durumu
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),  // Yup validation
    mode: 'onChange',   // Ne zaman validate edilecek? (onChange, onBlur, onSubmit)
  });

  /**
   * 📝 FORM SUBMIT HANDLER
   * 
   * Form submit edildiğinde çağrılır.
   * Validation geçerse onSubmit prop'u çağrılır.
   */
  const handleFormSubmit = async (data: LoginFormData) => {
    await onSubmit(data);
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Giriş Yap
        </h1>
        <p className="text-gray-600">
          Hesabınıza giriş yapın
        </p>
      </div>

      {/* Global Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/**
         * 📧 EMAIL INPUT
         * 
         * register('email') ile form'a kaydet.
         * Otomatik olarak:
         * - onChange handler eklenir
         * - value binding yapılır
         * - name attribute set edilir
         */}
        <Input
          {...register('email')}
          type="email"
          label="E-posta"
          placeholder="ornek@email.com"
          error={errors.email?.message}
          autoComplete="email"
          disabled={isLoading}
          icon={
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          }
        />

        {/**
         * 🔒 PASSWORD INPUT
         */}
        <Input
          {...register('password')}
          type="password"
          label="Şifre"
          placeholder="••••••••"
          error={errors.password?.message}
          autoComplete="current-password"
          disabled={isLoading}
          icon={
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
        />

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              {...register('rememberMe')}
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={isLoading}
            />
            <span className="ml-2 text-sm text-gray-700">
              Beni hatırla
            </span>
          </label>

          <Link
            to="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Şifremi unuttum
          </Link>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          fullWidth
          isLoading={isLoading}
          disabled={isLoading || !isValid}
        >
          {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </Button>

        {/* Register Link */}
        <div className="text-center text-sm text-gray-600">
          Hesabınız yok mu?{' '}
          <Link
            to="/register"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Kayıt ol
          </Link>
        </div>
      </form>

      {/* Social Login (Opsiyonel) */}
      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              veya
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>

          <button
            type="button"
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            <svg className="w-5 h-5 mr-2" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;

/**
 * 🎯 KULLANIM ÖRNEĞİ (LoginPage'de):
 * 
 * import LoginForm from '@/features/auth/components/LoginForm';
 * import { useAuth } from '@/features/auth/hooks/useAuth';
 * 
 * const LoginPage = () => {
 *   const { login, isLoggingIn, error } = useAuth();
 *   
 *   return (
 *     <div className="min-h-screen flex items-center justify-center bg-gray-50">
 *       <LoginForm
 *         onSubmit={login}
 *         isLoading={isLoggingIn}
 *         error={error}
 *       />
 *     </div>
 *   );
 * };
 */

/**
 * 💡 PRO TIP: Controlled vs Uncontrolled
 * 
 * React Hook Form varsayılan olarak UNCONTROLLED kullanır.
 * 
 * Uncontrolled (Varsayılan):
 * - Re-render YOK
 * - Performanslı
 * - register() ile kullanılır
 * 
 * Controlled (watch() ile):
 * - Re-render VAR
 * - Real-time değer değişimi gerekirse
 * - setValue() ile kullanılır
 * 
 * const password = watch('password');
 * // Her password değişiminde re-render olur
 */

/**
 * 🔥 BEST PRACTICE: Error Handling
 * 
 * 3 tip hata var:
 * 
 * 1. Validation Error (Field bazlı):
 *    errors.email?.message
 * 
 * 2. Backend Error (Form bazlı):
 *    error prop (API'den gelen)
 * 
 * 3. Network Error:
 *    Try-catch ile yakala
 */