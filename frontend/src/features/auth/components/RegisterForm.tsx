// frontend/src/features/auth/components/RegisterForm.tsx

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Link } from 'react-router-dom';
import { registerSchema, type RegisterFormData } from '../utils/validation';
import { Button, Input } from '@/shared/components/ui/base';

interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => void | Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

const RegisterForm = ({ onSubmit, isLoading = false, error }: RegisterFormProps) => {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    mode: 'onChange',
  });

  // Şifre gücü göstergesi için
  const password = watch('password');
  const passwordStrength = calculatePasswordStrength(password);

  /**
   * 📝 FORM SUBMIT
   */
  const handleFormSubmit = async (data: RegisterFormData) => {
    await onSubmit(data);
  };

  /**
   * 🖼️ AVATAR PREVIEW
   * 
   * Seçilen resmi önizle
   */
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Hesap Oluştur
        </h1>
        <p className="text-gray-600">
          Ücretsiz hesabınızı oluşturun
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
        {/* Avatar Upload */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-300">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input
                {...register('avatar')}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={isLoading}
              />
            </label>
          </div>
        </div>

        {/* Name Fields (2 columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            {...register('firstName')}
            label="Ad"
            placeholder="Ahmet"
            error={errors.firstName?.message}
            autoComplete="given-name"
            disabled={isLoading}
          />

          <Input
            {...register('lastName')}
            label="Soyad"
            placeholder="Yılmaz"
            error={errors.lastName?.message}
            autoComplete="family-name"
            disabled={isLoading}
          />
        </div>

        {/* Email */}
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

        {/* Phone */}
        <Input
          {...register('phone')}
          type="tel"
          label="Telefon (Opsiyonel)"
          placeholder="5551234567"
          error={errors.phone?.message}
          autoComplete="tel"
          disabled={isLoading}
          helperText="Örnek: 5551234567"
          icon={
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          }
        />

        {/* Password */}
        <div>
          <Input
            {...register('password')}
            type="password"
            label="Şifre"
            placeholder="••••••••"
            error={errors.password?.message}
            autoComplete="new-password"
            disabled={isLoading}
            icon={
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            }
          />
          
          {/* Password Strength Indicator */}
          {password && (
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      passwordStrength.color
                    }`}
                    style={{ width: `${passwordStrength.percentage}%` }}
                  />
                </div>
                <span className={`text-xs font-medium ${passwordStrength.textColor}`}>
                  {passwordStrength.label}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Password Confirm */}
        <Input
          {...register('passwordConfirm')}
          type="password"
          label="Şifre Tekrarı"
          placeholder="••••••••"
          error={errors.passwordConfirm?.message}
          autoComplete="new-password"
          disabled={isLoading}
        />

        {/* Terms & Conditions */}
        <div className="flex items-start">
          <input
            type="checkbox"
            required
            className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            disabled={isLoading}
          />
          <label className="ml-2 text-sm text-gray-700">
            <Link to="/terms" className="text-blue-600 hover:text-blue-700 font-medium">
              Kullanım Koşulları
            </Link>
            {' '}ve{' '}
            <Link to="/privacy" className="text-blue-600 hover:text-blue-700 font-medium">
              Gizlilik Politikası
            </Link>
            'nı okudum ve kabul ediyorum.
          </label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          fullWidth
          isLoading={isLoading}
          disabled={isLoading || !isValid}
        >
          {isLoading ? 'Hesap oluşturuluyor...' : 'Hesap Oluştur'}
        </Button>

        {/* Login Link */}
        <div className="text-center text-sm text-gray-600">
          Zaten hesabınız var mı?{' '}
          <Link
            to="/login"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Giriş yap
          </Link>
        </div>
      </form>
    </div>
  );
};

/**
 * 🔒 PASSWORD STRENGTH CALCULATOR
 * 
 * Şifre gücünü hesapla (0-100)
 */
function calculatePasswordStrength(password?: string) {
  if (!password) {
    return {
      percentage: 0,
      label: '',
      color: 'bg-gray-300',
      textColor: 'text-gray-500',
    };
  }

  let strength = 0;

  // Uzunluk kontrolü
  if (password.length >= 8) strength += 25;
  if (password.length >= 12) strength += 25;

  // Karakter çeşitliliği
  if (/[a-z]/.test(password)) strength += 12.5;
  if (/[A-Z]/.test(password)) strength += 12.5;
  if (/[0-9]/.test(password)) strength += 12.5;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;

  // Label ve renk
  let label = 'Çok Zayıf';
  let color = 'bg-red-500';
  let textColor = 'text-red-500';

  if (strength >= 75) {
    label = 'Güçlü';
    color = 'bg-green-500';
    textColor = 'text-green-500';
  } else if (strength >= 50) {
    label = 'Orta';
    color = 'bg-yellow-500';
    textColor = 'text-yellow-500';
  } else if (strength >= 25) {
    label = 'Zayıf';
    color = 'bg-orange-500';
    textColor = 'text-orange-500';
  }

  return { percentage: strength, label, color, textColor };
}

export default RegisterForm;

/**
 * 💡 PRO TIP: File Upload
 * 
 * File input'u React Hook Form ile kullanırken:
 * 
 * const { register } = useForm();
 * 
 * <input
 *   {...register('avatar')}
 *   type="file"
 *   onChange={(e) => {
 *     register('avatar').onChange(e); // RHF'e bildir
 *     handlePreview(e); // Kendi fonksiyonun
 *   }}
 * />
 * 
 * File'ı form submit'te al:
 * const onSubmit = (data) => {
 *   const file = data.avatar[0]; // FileList'ten ilk dosya
 *   const formData = new FormData();
 *   formData.append('avatar', file);
 * };
 */