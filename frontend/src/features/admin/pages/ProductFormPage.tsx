// frontend/src/features/admin/pages/ProductFormPage.tsx

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-hot-toast';
import apiClient from '@/shared/services/api/client';
import { PRODUCT_ENDPOINTS, CATEGORY_ENDPOINTS, BRAND_ENDPOINTS } from '@/shared/services/api/endpoints';
import { Button, Input, Textarea, Select } from '@/shared/components/ui/base';
import { Loading } from '@/shared/components/ui/feedback';

/**
 * 🎓 ÖĞREN: Ürün Formu (Ekle/Düzenle)
 * 
 * Bu sayfa hem yeni ürün ekleme hem de mevcut ürünü düzenleme için kullanılır.
 * 
 * Özellikler:
 * - Formik/React Hook Form ile form yönetimi
 * - Yup ile validation
 * - Çoklu resim upload
 * - Kategori ve marka seçimi
 * - Zengin metin editörü (açıklama)
 * - Preview (önizleme)
 */

// Validation Schema
const productSchema = yup.object({
  name: yup.string().required('Ürün adı gerekli').min(3, 'En az 3 karakter'),
  description: yup.string().required('Açıklama gerekli').min(10, 'En az 10 karakter'),
  price: yup.number().required('Fiyat gerekli').positive('Pozitif olmalı'),
  discountedPrice: yup.number().optional().positive('Pozitif olmalı'),
  stock: yup.number().required('Stok gerekli').min(0, 'Negatif olamaz'),
  category: yup.string().required('Kategori seçiniz'),
  brand: yup.string().required('Marka seçiniz'),
  sku: yup.string().optional(),
  barcode: yup.string().optional(),
});

type ProductFormData = yup.InferType<typeof productSchema>;

interface Category {
  _id: string;
  name: string;
}

interface Brand {
  _id: string;
  name: string;
}

const ProductFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Düzenleme modunda ID gelir
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<Array<{ url: string; isMain: boolean }>>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProductFormData>({
    resolver: yupResolver(productSchema),
  });

  const price = watch('price');
  const discountedPrice = watch('discountedPrice');

  /**
   * 📊 FETCH CATEGORIES & BRANDS
   */
  useEffect(() => {
    
    // Kategorileri güvenli bir şekilde çek
    const fetchCategories = async () => {
      try {
        const res = await apiClient.get(CATEGORY_ENDPOINTS.LIST);
        
        // Olası iki veri yapısını da kontrol et:
        // 1. res.data.data.categories (Obje içindeyse)
        // 2. res.data.data (Doğrudan dizi ise)
        // 3. [] (Hiçbiri değilse boş dizi ata)
        const categoriesData = res.data.data?.categories || res.data.data || [];
        
        if (!Array.isArray(categoriesData)) {
            console.error("Kategoriler API'den dizi olarak gelmedi:", res.data);
            toast.error('Kategori verisi hatalı yüklendi');
            setCategories([]); // Hata durumunda boş diziye çek
        } else {
            setCategories(categoriesData);
        }

      } catch (error) {
        toast.error('Kategoriler yüklenemedi');
        setCategories([]); // Hata durumunda boş dizi
      }
    };

    // Markaları güvenli bir şekilde çek
    const fetchBrands = async () => {
      try {
        const res = await apiClient.get(BRAND_ENDPOINTS.LIST);
        
        // Olası iki veri yapısını da kontrol et:
        const brandsData = res.data.data?.brands || res.data.data || [];
        console.log('Marka verisi:', res);
        
        if (!Array.isArray(brandsData)) {
            console.error("Markalar API'den dizi olarak gelmedi:", res.data);
            toast.error('Marka verisi hatalı yüklendi');
            setBrands([]); // Hata durumunda boş diziye çek
        } else {
            setBrands(brandsData);
        }
        
      } catch (error) {
        toast.error('Markalar yüklenemedi');
        setBrands([]); // Hata durumunda boş dizi
      }
    };

    fetchCategories();
    fetchBrands();
    
  }, []);

  /**
   * 📝 FETCH PRODUCT (Düzenleme modunda)
   */
  useEffect(() => {
    if (isEditMode && id) {
      const fetchProduct = async () => {
        try {
          setLoading(true);
          const response = await apiClient.get(PRODUCT_ENDPOINTS.DETAIL(id));
          const product = response.data.data;

          // Form değerlerini doldur
          setValue('name', product.name);
          setValue('description', product.description);
          setValue('price', product.price);
          setValue('discountedPrice', product.discountedPrice);
          setValue('stock', product.stock);
          setValue('category', product.category._id);
          setValue('brand', product.brand._id);
          setValue('sku', product.sku);
          setValue('barcode', product.barcode);

          // Mevcut resimleri kaydet
          setExistingImages(product.images);
        } catch (error) {
          toast.error('Ürün yüklenemedi');
          navigate('/admin/products');
        } finally {
          setLoading(false);
        }
      };

      fetchProduct();
    }
  }, [isEditMode, id, setValue, navigate]);

  /**
   * 🖼️ HANDLE IMAGE CHANGE
   */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + images.length + existingImages.length > 5) {
      toast.error('En fazla 5 resim yükleyebilirsiniz');
      return;
    }

    setImages(prev => [...prev, ...files]);

    // Preview oluştur
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviewImages(prev => [...prev, ...newPreviews]);
  };

  /**
   * 🗑️ REMOVE IMAGE
   */
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * 🗑️ REMOVE EXISTING IMAGE
   */
  const removeExistingImage = async (imageUrl: string) => {
    // Backend'den resmi sil
    // Burada image ID'si gerekir, basitleştirmek için sadece frontend'den kaldırıyoruz
    setExistingImages(prev => prev.filter(img => img.url !== imageUrl));
    toast.success('Resim kaldırıldı');
  };

  /**
   * 💾 FORM SUBMIT
   */
  const onSubmit = async (data: ProductFormData) => {
  try {
    setLoading(true);

    // FormData oluştur
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('price', data.price.toString());
    if (data.discountedPrice) {
      formData.append('discountedPrice', data.discountedPrice.toString());
    }
    formData.append('stock', data.stock.toString());
    formData.append('category', data.category);
    formData.append('brand', data.brand);
    if (data.sku) formData.append('sku', data.sku);
    if (data.barcode) formData.append('barcode', data.barcode);

    // Resimleri ekle
    images.forEach(image => {
      formData.append('images', image);
    });

    if (isEditMode && id) {
      // Güncelleme
      await apiClient.put(PRODUCT_ENDPOINTS.UPDATE(id), formData);
      // ❌ KALDIR: { headers: { 'Content-Type': 'multipart/form-data' } }
      toast.success('Ürün güncellendi!');
    } else {
      // Yeni ürün
      await apiClient.post(PRODUCT_ENDPOINTS.CREATE, formData);
      // ❌ KALDIR: { headers: { 'Content-Type': 'multipart/form-data' } }
      toast.success('Ürün eklendi!');
    }

    navigate('/admin/products');
  } catch (error: any) {
    console.error('❌ Ürün kaydedilemedi:', error);
    toast.error(error.response?.data?.message || 'İşlem başarısız');
  } finally {
    setLoading(false);
  }
};

  if (loading && isEditMode) {
    return <Loading fullScreen message="Ürün yükleniyor..." />;
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Ürün bilgilerini girin ve kaydedin
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
              label="Ürün Adı"
              placeholder="iPhone 15 Pro Max"
              error={errors.name?.message}
              fullWidth
            />

            <Textarea
              {...register('description')}
              label="Açıklama"
              placeholder="Ürün hakkında detaylı bilgi..."
              rows={6}
              error={errors.description?.message}
              fullWidth
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                {...register('category')}
                label="Kategori"
                options={categories.map(c => ({ value: c._id, label: c.name }))}
                placeholder="Kategori seçiniz"
                error={errors.category?.message}
                fullWidth
              />

              <Select
                {...register('brand')}
                label="Marka"
                options={brands.map(b => ({ value: b._id, label: b.name }))}
                placeholder="Marka seçiniz"
                error={errors.brand?.message}
                fullWidth
              />
            </div>
          </div>
        </div>

        {/* Fiyat ve Stok */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Fiyat ve Stok
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              {...register('price')}
              type="number"
              label="Fiyat (TL)"
              placeholder="999.99"
              error={errors.price?.message}
              fullWidth
            />

            <Input
              {...register('discountedPrice')}
              type="number"
              label="İndirimli Fiyat (TL)"
              placeholder="799.99"
              error={errors.discountedPrice?.message}
              helperText="Opsiyonel"
              fullWidth
            />

            <Input
              {...register('stock')}
              type="number"
              label="Stok Adedi"
              placeholder="100"
              error={errors.stock?.message}
              fullWidth
            />
          </div>

          {/* Fiyat Önizleme */}
          {price && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Önizleme:</strong>{' '}
                {discountedPrice ? (
                  <>
                    <span className="text-xl font-bold text-blue-600">
                      {discountedPrice} TL
                    </span>
                    {' '}
                    <span className="line-through text-gray-500">
                      {price} TL
                    </span>
                    {' '}
                    <span className="text-green-600">
                      (%{Math.round((1 - discountedPrice / price) * 100)} indirim)
                    </span>
                  </>
                ) : (
                  <span className="text-xl font-bold text-gray-900">
                    {price} TL
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Ek Bilgiler */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Ek Bilgiler (Opsiyonel)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('sku')}
              label="SKU"
              placeholder="PROD-12345"
              error={errors.sku?.message}
              fullWidth
            />

            <Input
              {...register('barcode')}
              label="Barkod"
              placeholder="1234567890123"
              error={errors.barcode?.message}
              fullWidth
            />
          </div>
        </div>

        {/* Resimler */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Ürün Resimleri
          </h2>

          {/* Mevcut Resimler (Düzenleme modunda) */}
          {existingImages.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Mevcut Resimler:</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {existingImages.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img.url}
                      alt={`Existing ${index}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    {img.isMain && (
                      <span className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs rounded">
                        Ana
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeExistingImage(img.url)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Yeni Resim Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Yeni Resim Ekle (En fazla 5 adet)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="mt-1 text-xs text-gray-500">
              PNG, JPG, GIF (Max 5MB)
            </p>
          </div>

          {/* Resim Önizleme */}
          {previewImages.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
              {previewImages.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button type="submit" isLoading={loading} disabled={loading}>
            {isEditMode ? 'Güncelle' : 'Kaydet'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/products')}
          >
            İptal
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProductFormPage;

/**
 * 💡 PRO TIP: Form Best Practices
 * 
 * 1. Validation - Client-side (Yup) + Server-side
 * 2. Preview - Kullanıcı görsün (fiyat, resim)
 * 3. Loading states - Butonları devre dışı bırak
 * 4. Error handling - Her field için ayrı
 * 5. Auto-save (Draft) - Kullanıcı kaybetmesin
 */