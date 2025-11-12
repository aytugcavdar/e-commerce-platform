// frontend/src/features/admin/pages/BrandFormPage.tsx

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-hot-toast';
import apiClient from '@/shared/services/api/client';
import { BRAND_ENDPOINTS } from '@/shared/services/api/endpoints';
import { Button, Input, Textarea } from '@/shared/components/ui/base';
import { Loading } from '@/shared/components/ui/feedback';

// Validation Schema
const brandSchema = yup.object({
  name: yup.string().required('Marka adı gerekli').min(2, 'En az 2 karakter'),
  description: yup.string().optional(),
});

type BrandFormData = yup.InferType<typeof brandSchema>;

const BrandFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Düzenleme modunda ID gelir
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [existingLogo, setExistingLogo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<BrandFormData>({
    resolver: yupResolver(brandSchema),
  });

  /**
   * 📝 FETCH BRAND (Düzenleme modunda)
   */
  useEffect(() => {
    if (isEditMode && id) {
      const fetchBrand = async () => {
        try {
          setLoading(true);
          const response = await apiClient.get(BRAND_ENDPOINTS.DETAIL(id));
          const brand = response.data.data;

          // Form değerlerini doldur
          setValue('name', brand.name);
          setValue('description', brand.description);

          // Mevcut logoyu kaydet
          if (brand.logo) {
            setExistingLogo(brand.logo);
          }
        } catch (error) {
          toast.error('Marka yüklenemedi');
          navigate('/admin/brands');
        } finally {
          setLoading(false);
        }
      };

      fetchBrand();
    }
  }, [isEditMode, id, setValue, navigate]);

  /**
   * 🖼️ HANDLE LOGO CHANGE
   */
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      setLogo(file);
      // Preview oluştur
      setPreviewLogo(URL.createObjectURL(file));
      setExistingLogo(null); // Yeni logo seçilince eskiyi kaldır
    }
  };

  /**
   * 🗑️ REMOVE LOGO
   */
  const removeLogo = () => {
    setLogo(null);
    setPreviewLogo(null);
    setExistingLogo(null);
  };


  /**
   * 💾 FORM SUBMIT
   */
  const onSubmit = async (data: BrandFormData) => {
    try {
      setLoading(true);

      // FormData oluştur (logo için)
      const formData = new FormData();
      formData.append('name', data.name);
      if (data.description) {
        formData.append('description', data.description);
      }
      
      // Yeni logo eklenmişse
      if (logo) {
        formData.append('logo', logo);
      }

      if (isEditMode && id) {
        // Güncelleme
        await apiClient.put(BRAND_ENDPOINTS.UPDATE(id), formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Marka güncellendi!');
      } else {
        // Yeni marka
        await apiClient.post(BRAND_ENDPOINTS.CREATE, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Marka eklendi!');
      }

      navigate('/admin/brands');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'İşlem başarısız');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return <Loading fullScreen message="Marka yükleniyor..." />;
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Markayı Düzenle' : 'Yeni Marka Ekle'}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Marka bilgilerini girin ve kaydedin
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Temel Bilgiler */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Temel Bilgiler
          </h2>

          <div className="space-y-4">
            <Input
              {...register('name')}
              label="Marka Adı"
              placeholder="Apple"
              error={errors.name?.message}
              fullWidth
            />

            <Textarea
              {...register('description')}
              label="Açıklama (Opsiyonel)"
              placeholder="Marka hakkında kısa bilgi..."
              rows={4}
              error={errors.description?.message}
              fullWidth
            />
          </div>
        </div>

        {/* Logo */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Marka Logosu
          </h2>

          {/* Logo Önizleme */}
          {(previewLogo || existingLogo) && (
            <div className="mb-4 relative group w-48 h-48">
              <img
                src={previewLogo || existingLogo || ''}
                alt="Marka Önizleme"
                className="w-full h-full object-contain rounded-lg border border-gray-200 p-2"
              />
              <button
                type="button"
                onClick={removeLogo}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Yeni Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo Yükle
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="mt-1 text-xs text-gray-500">
              PNG, JPG, GIF (Max 2MB)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button type="submit" isLoading={loading} disabled={loading}>
            {isEditMode ? 'Güncelle' : 'Kaydet'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/brands')}
          >
            İptal
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BrandFormPage;