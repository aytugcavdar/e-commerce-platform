// frontend/src/features/admin/pages/CategoriesManagementPage.tsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import apiClient from '@/shared/services/api/client';
import { CATEGORY_ENDPOINTS } from '@/shared/services/api/endpoints';
import { Loading, ErrorMessage } from '@/shared/components/ui/feedback';
import { Button } from '@/shared/components/ui/base';

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
}

const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  /**
   * 📊 FETCH CATEGORIES
   * API'den kategorileri çek
   */
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get(CATEGORY_ENDPOINTS.LIST);
      
      // API'den dönen veri yapısına göre (genellikle response.data.data)
      // ProductFormPage'deki kullanıma göre .data.data varsayıyoruz
      setCategories(response.data.data); 
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kategoriler yüklenirken hata oluştu');
      toast.error('Kategoriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🔄 USE EFFECT - İlk yüklemede
   */
  useEffect(() => {
    fetchCategories();
  }, []);

  /**
   * 🗑️ DELETE CATEGORY
   */
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      await apiClient.delete(CATEGORY_ENDPOINTS.DELETE(categoryToDelete));
      toast.success('Kategori başarıyla silindi');
      
      // Listeyi yenile
      fetchCategories();
      
      // Modal'ı kapat
      setDeleteModalOpen(false);
      setCategoryToDelete(null);
      
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Kategori silinemedi');
    }
  };

  /**
   * 🔄 TOGGLE ACTIVE STATUS
   * Kategoriyi aktif/pasif yap
   */
  const toggleCategoryStatus = async (categoryId: string, currentStatus: boolean) => {
    try {
      // Backend PUT /api/categories/:id
      await apiClient.put(CATEGORY_ENDPOINTS.UPDATE(categoryId), {
        isActive: !currentStatus
      });
      
      toast.success(`Kategori ${!currentStatus ? 'aktif' : 'pasif'} edildi`);
      fetchCategories();
      
    } catch (err: any) {
      toast.error('Durum güncellenemedi');
    }
  };


  if (loading && categories.length === 0) {
    return <Loading fullScreen message="Kategoriler yükleniyor..." />;
  }

  return (
    <div className="space-y-6">
      {/* 📌 HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Kategori Yönetimi
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Toplam {categories.length} kategori
          </p>
        </div>
        
        <Link to="/admin/categories/new">
          <Button>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Kategori Ekle
          </Button>
        </Link>
      </div>

      {/* 📋 CATEGORIES TABLE */}
      {error ? (
        <ErrorMessage message={error} onRetry={fetchCategories} />
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <h3 className="mt-4 text-lg font-medium text-gray-900">Kategori bulunamadı</h3>
          <p className="mt-2 text-sm text-gray-600">Yeni kategori ekleyerek başlayın</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Kategori
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
                {categories.map((category) => (
                  <tr key={category._id} className="hover:bg-gray-50 transition-colors">
                    {/* Kategori */}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {category.image && (
                          <img
                            src={category.image}
                            alt={category.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div className={category.image ? "ml-4" : ""}>
                          <div className="font-medium text-gray-900">{category.name}</div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Slug */}
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {category.slug}
                    </td>
                    
                    {/* Durum */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleCategoryStatus(category._id, category.isActive)}
                        className={`
                          inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${category.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                        `}
                      >
                        {category.isActive ? 'Aktif' : 'Pasif'}
                      </button>
                    </td>
                    
                    {/* İşlemler */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/categories/${category._id}/edit`}
                          className="text-blue-600 hover:text-blue-700 p-1"
                          title="Düzenle"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => {
                            setCategoryToDelete(category._id);
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
              Kategoriyi Sil
            </h3>
            <p className="text-gray-600 mb-6">
              Bu kategoriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setCategoryToDelete(null);
                }}
              >
                İptal
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteCategory}
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

export default AdminCategoriesPage;