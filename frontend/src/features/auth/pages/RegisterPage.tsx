// frontend/src/features/auth/pages/RegisterPage.tsx

import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import RegisterForm from '../components/RegisterForm';
import { useAuth } from '../hooks/useAuth';
import type { RegisterFormData } from '../utils/validation';

const RegisterPage = () => {
  const { register, isRegistering, error, clearError } = useAuth();

  /**
   * ❌ CLEAR ERROR ON UNMOUNT
   */
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  /**
   * 📝 HANDLE REGISTER SUBMIT
   */
  const handleRegister = async (data: RegisterFormData) => {
    const result = await register(data);

    if (result.success) {
      toast.success('Kayıt başarılı! E-postanızı doğrulayın 📧');
      // useAuth hook'u otomatik olarak /verify-email'e yönlendiriyor
    } else {
      toast.error(result.error || 'Kayıt olurken bir hata oluştu');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full">
        <RegisterForm
          onSubmit={handleRegister}
          isLoading={isRegistering}
          error={error}
        />
      </div>
    </div>
  );
};

export default RegisterPage;