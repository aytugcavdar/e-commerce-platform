// frontend/src/features/user/pages/ProfileEditPage.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Container } from '@/shared/components/layout';
import { Button, Input } from '@/shared/components/ui/base';
import apiClient from '@/shared/services/api/client';
import { USER_ENDPOINTS } from '@/shared/services/api/endpoints';

/**
 * 🎓 ÖĞREN: ProfileEditPage
 * 
 * Kullanıcı profil bilgilerini düzenleme sayfası.
 * 
 * Özellikler:
 * - Ad, soyad, telefon güncelleme
 * - Avatar yükleme
 * - Şifre değiştirme (ayrı form)
 */

/**
 * 📝 VALIDATION SCHEMA
 */
const profileSchema = yup.object({
  firstName: yup
    .string()
    .required('Ad gereklidir')
    .min(2, 'En az 2 karakter olmalı'),
  lastName: yup
    .string()
    .required('Soyad gereklidir')
    .min(2, 'En az 2 karakter olmalı'),
  phone: yup
    .string()
    .matches(/^[0-9]{10}$/, 'Geçerli bir telefon numarası girin'),
});

type ProfileFormData = yup.InferType<typeof profileSchema>;

const passwordSchema = yup.object({
  currentPassword: yup.string().required('Mevcut şifre gereklidir'),
  newPassword: yup
    .string()
    .required('Yeni şifre gereklidir')
    .min(8, 'En az 8 karakter olmalı'),
  confirmPassword: yup
    .string()
    .required('Şifre tekrarı gereklidir')
    .oneOf([yup.ref('newPassword')], 'Şifreler eşleşmiyor'),
});

type PasswordFormData = yup.InferType<typeof passwordSchema>;

const ProfileEditPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Profil Form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
    },
  });

  // Şifre Form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm<PasswordFormData>({
    resolver: yupResolver(passwordSchema),
  });

  /**
   * 💾 Profil Güncelle
   */
  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsUpdating(true);

    try {
      await apiClient.put(USER_ENDPOINTS.UPDATE_PROFILE, data);
      toast.success('Profil güncellendi!');
      navigate('/profile');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Profil güncellenemedi';
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * 🔐 Şifre Değiştir
   */
  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsChangingPassword(true);

    try {
      await apiClient.post(USER_ENDPOINTS.UPDATE_PROFILE, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Şifre değiştirildi!');
      resetPasswordForm();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Şifre değiştirilemedi';
      toast.error(message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        {/* Başlık */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Profili Düzenle
          </h1>
          <p className="text-gray-600">
            Hesap bilgilerinizi güncelleyin
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sol: Profil Bilgileri */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Kişisel Bilgiler
            </h2>

            <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
              <Input
                {...register('firstName')}
                label="Ad"
                error={errors.firstName?.message}
                fullWidth
              />

              <Input
                {...register('lastName')}
                label="Soyad"
                error={errors.lastName?.message}
                fullWidth
              />

              <Input
                {...register('phone')}
                label="Telefon"
                type="tel"
                error={errors.phone?.message}
                helperText="Örnek: 5551234567"
                fullWidth
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  isLoading={isUpdating}
                  disabled={isUpdating}
                >
                  Kaydet
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/profile')}
                >
                  İptal
                </Button>
              </div>
            </form>
          </div>

          {/* Sağ: Şifre Değiştir */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Şifre Değiştir
            </h2>

            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
              <Input
                {...registerPassword('currentPassword')}
                type="password"
                label="Mevcut Şifre"
                error={passwordErrors.currentPassword?.message}
                fullWidth
              />

              <Input
                {...registerPassword('newPassword')}
                type="password"
                label="Yeni Şifre"
                error={passwordErrors.newPassword?.message}
                fullWidth
              />

              <Input
                {...registerPassword('confirmPassword')}
                type="password"
                label="Yeni Şifre Tekrar"
                error={passwordErrors.confirmPassword?.message}
                fullWidth
              />

              <div className="pt-4">
                <Button
                  type="submit"
                  isLoading={isChangingPassword}
                  disabled={isChangingPassword}
                  fullWidth
                >
                  Şifreyi Değiştir
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ProfileEditPage;