// frontend/src/features/admin/pages/CategoryFormPage.tsx

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-hot-toast';
import apiClient from '@/shared/services/api/client';
import { CATEGORY_ENDPOINTS } from '@/shared/services/api/endpoints';
import { Button, Input, Textarea } from '@/shared/components/ui/base';
import { Loading } from '@/shared/components/ui/feedback';

// Validation Schema
const categorySchema = yup.object({
  name: yup.string().required('Kategori adı gerekli').min(2, 'En az 2 karakter'),
  description: yup.string().optional(),
});

type CategoryFormData = yup.InferType<typeof categorySchema>;

const CategoryFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Düzenleme modunda ID gelir
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CategoryFormData>({
    resolver: yupResolver(categorySchema),
  });

  /**
   * 📝 FETCH CATEGORY (Düzenleme modunda)
   */
  useEffect(() => {
    if (isEditMode && id) {
      const fetchCategory = async () => {
        try {
          setLoading(true);
          const response = await apiClient.get(CATEGORY_ENDPOINTS.DETAIL(id));
          const category = response.data.data;

          // Form değerlerini doldur
          setValue('name', category.name);
          setValue('description', category.description);

          // Mevcut resmi kaydet
          if (category.image) {
            setExistingImage(category.image);
          }
        } catch (error) {
          toast.error('Kategori yüklenemedi');
          navigate('/admin/categories');
        } finally {
          setLoading(false);
        }
      };

      fetchCategory();
    }
  }, [isEditMode, id, setValue, navigate]);

  /**
   * 🖼️ HANDLE IMAGE CHANGE
   */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      setImage(file);
      // Preview oluştur
      setPreviewImage(URL.createObjectURL(file));
      setExistingImage(null); // Yeni resim seçilince eskiyi kaldır
    }
  };

  /**
   * 🗑️ REMOVE IMAGE
   */
  const removeImage = () => {
    setImage(null);
    setPreviewImage(null);
    setExistingImage(null);
  };


  /**
   * 💾 FORM SUBMIT
   */
  const onSubmit = async (data: CategoryFormData) => {
    try {
      setLoading(true);

      // FormData oluştur (resim için)
      const formData = new FormData();
      formData.append('name', data.name);
      if (data.description) {
        formData.append('description', data.description);
      }
      
      // Yeni resim eklenmişse
      if (image) {
        formData.append('image', image);
      }

      if (isEditMode && id) {
        // Güncelleme
        await apiClient.put(CATEGORY_ENDPOINTS.UPDATE(id), formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Kategori güncellendi!');
      } else {
        // Yeni kategori
        await apiClient.post(CATEGORY_ENDPOINTS.CREATE, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Kategori eklendi!');
      }

      navigate('/admin/categories');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'İşlem başarısız');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return <Loading fullScreen message="Kategori yükleniyor..." />;
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle'}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Kategori bilgilerini girin ve kaydedin
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
              label="Kategori Adı"
              placeholder="Elektronik"
              error={errors.name?.message}
              fullWidth
            />

            <Textarea
              {...register('description')}
              label="Açıklama (Opsiyonel)"
              placeholder="Kategori hakkında kısa bilgi..."
              rows={4}
              error={errors.description?.message}
              fullWidth
            />
          </div>
        </div>

        {/* Resim */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Kategori Resmi
          </h2>

          {/* Resim Önizleme */}
          {(previewImage || existingImage) && (
            <div className="mb-4 relative group w-48 h-48">
              <img
                src={previewImage || existingImage || ''}
                alt="Kategori Önizleme"
                className="w-full h-full object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Yeni Resim Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resim Yükle
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="mt-1 text-xs text-gray-500">
              PNG, JPG, GIF (Max 2MB)
            </t>
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
            onClick={() => navigate('/admin/categories')}
          >
            İptal
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CategoryFormPage;