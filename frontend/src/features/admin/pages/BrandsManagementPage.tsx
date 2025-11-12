// frontend/src/features/admin/pages/BrandsManagementPage.tsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import apiClient from '@/shared/services/api/client';
import { BRAND_ENDPOINTS } from '@/shared/services/api/endpoints';
import { Loading, ErrorMessage } from '@/shared/components/ui/feedback';
import { Button } from '@/shared/components/ui/base';

interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  isActive: boolean;
  createdAt: string;
}

const AdminBrandsPage = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<string | null>(null);

  /**
   * 📊 FETCH BRANDS
   * API'den markaları çek
   */
  const fetchBrands = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get(BRAND_ENDPOINTS.LIST);
      
      // ✅ FIX: Farklı API response yapılarını kontrol et
      const data = response.data.data;
      
      // API'den array, object veya nested object gelebilir
      if (Array.isArray(data)) {
        setBrands(data);
      } else if (data?.brands && Array.isArray(data.brands)) {
        setBrands(data.brands);
      } else if (typeof data === 'object' && data !== null) {
        // Eğer object ise, değerleri array'e çevir
        setBrands(Object.values(data));
      } else {
        console.error('Unexpected API response format:', response.data);
        setBrands([]);
      }
      
    } catch (err: any) {
      console.error('Fetch brands error:', err);
      setError(err.response?.data?.message || 'Markalar yüklenirken hata oluştu');
      toast.error('Markalar yüklenemedi');
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🔄 USE EFFECT - İlk yüklemede
   */
  useEffect(() => {
    fetchBrands();
  }, []);

  /**
   * 🗑️ DELETE BRAND
   */
  const handleDeleteBrand = async () => {
    if (!brandToDelete) return;
    
    try {
      await apiClient.delete(BRAND_ENDPOINTS.DELETE(brandToDelete));
      toast.success('Marka başarıyla silindi');
      
      // Listeyi yenile
      fetchBrands();
      
      // Modal'ı kapat
      setDeleteModalOpen(false);
      setBrandToDelete(null);
      
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Marka silinemedi');
    }
  };

  /**
   * 🔄 TOGGLE ACTIVE STATUS
   * Markayı aktif/pasif yap
   */
  const toggleBrandStatus = async (brandId: string, currentStatus: boolean) => {
    try {
      await apiClient.put(BRAND_ENDPOINTS.UPDATE(brandId), {
        isActive: !currentStatus
      });
      
      toast.success(`Marka ${!currentStatus ? 'aktif' : 'pasif'} edildi`);
      fetchBrands();
      
    } catch (err: any) {
      toast.error('Durum güncellenemedi');
    }
  };


  if (loading && brands.length === 0) {
    return <Loading fullScreen message="Markalar yükleniyor..." />;
  }

  return (
    <div className="space-y-6">
      {/* 📌 HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Marka Yönetimi
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Toplam {brands.length} marka
          </p>
        </div>
        
        <Link to="/admin/brands/new">
          <Button>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Marka Ekle
          </Button>
        </Link>
      </div>

      {/* 📋 BRANDS TABLE */}
      {error ? (
        <ErrorMessage message={error} onRetry={fetchBrands} />
      ) : brands.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <h3 className="mt-4 text-lg font-medium text-gray-900">Marka bulunamadı</h3>
          <p className="mt-2 text-sm text-gray-600">Yeni marka ekleyerek başlayın</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Marka
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {brands.map((brand) => (
                  <tr key={brand._id} className="hover:bg-gray-50 transition-colors">
                    {/* Marka */}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {brand.logo && (
                          <img
                            src={brand.logo}
                            alt={brand.name}
                            className="w-12 h-12 rounded-lg object-contain"
                          />
                        )}
                        <div className={brand.logo ? "ml-4" : ""}>
                          <div className="font-medium text-gray-900">{brand.name}</div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Slug */}
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {brand.slug}
                    </td>
                    
                    {/* Durum */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleBrandStatus(brand._id, brand.isActive)}
                        className={`
                          inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${brand.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                        `}
                      >
                        {brand.isActive ? 'Aktif' : 'Pasif'}
                      </button>
                    </td>
                    
                    {/* İşlemler */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/brands/${brand._id}/edit`}
                          className="text-blue-600 hover:text-blue-700 p-1"
                          title="Düzenle"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => {
                            setBrandToDelete(brand._id);
                            setDeleteModalOpen(true);
                          }}
                          className="text-red-600 hover:text-red-700 p-1"
                          title="Sil"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🗑️ DELETE MODAL */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Markayı Sil
            </h3>
            <p className="text-gray-600 mb-6">
              Bu markayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setBrandToDelete(null);
                }}
              >
                İptal
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteBrand}
              >
                Evet, Sil
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBrandsPage;