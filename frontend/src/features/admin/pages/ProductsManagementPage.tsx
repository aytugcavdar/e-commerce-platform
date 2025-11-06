// frontend/src/features/admin/pages/ProductsManagementPage.tsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import apiClient from '@/shared/services/api/client';
import { PRODUCT_ENDPOINTS } from '@/shared/services/api/endpoints';
import { Loading, ErrorMessage } from '@/shared/components/ui/feedback';
import { Button } from '@/shared/components/ui/base';

/**
 * 🎓 ÖĞREN: Ürün Yönetimi Sayfası
 * 
 * Bu sayfa admin'in tüm ürünleri görmesini sağlar.
 * 
 * Özellikler:
 * - Ürün listesi (tablo)
 * - Arama (isim, kategori)
 * - Filtreleme (kategori, stok durumu)
 * - Sayfalama (pagination)
 * - Ürün ekleme/düzenleme/silme
 * - Toplu işlemler
 */

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  discountedPrice?: number;
  stock: number;
  category: {
    _id: string;
    name: string;
  };
  brand: {
    _id: string;
    name: string;
  };
  images: Array<{
    url: string;
    isMain: boolean;
  }>;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  totalPages: number;
  totalProducts: number;
}

const AdminProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalProducts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // all, in-stock, out-of-stock
  
  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  /**
   * 📊 FETCH PRODUCTS
   * 
   * API'den ürünleri çek
   */
  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      // Query params oluştur
      const params: any = {
        page,
        limit: pagination.limit,
      };
      
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory) params.category = selectedCategory;
      if (stockFilter === 'in-stock') params.inStock = true;
      if (stockFilter === 'out-of-stock') params.inStock = false;
      
      const response = await apiClient.get(PRODUCT_ENDPOINTS.LIST, { params });
      
      setProducts(response.data.data);
      setPagination(response.data.pagination);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ürünler yüklenirken hata oluştu');
      toast.error('Ürünler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🔄 USE EFFECT - İlk yüklemede ve filtrelerde
   */
  useEffect(() => {
    fetchProducts(1);
  }, [searchQuery, selectedCategory, stockFilter]);

  /**
   * 🗑️ DELETE PRODUCT
   */
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    try {
      await apiClient.delete(PRODUCT_ENDPOINTS.DELETE(productToDelete));
      toast.success('Ürün başarıyla silindi');
      
      // Listeyi yenile
      fetchProducts(pagination.page);
      
      // Modal'ı kapat
      setDeleteModalOpen(false);
      setProductToDelete(null);
      
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ürün silinemedi');
    }
  };

  /**
   * 🔄 TOGGLE ACTIVE STATUS
   * Ürünü aktif/pasif yap
   */
  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      await apiClient.patch(PRODUCT_ENDPOINTS.UPDATE(productId), {
        isActive: !currentStatus
      });
      
      toast.success(`Ürün ${!currentStatus ? 'aktif' : 'pasif'} edildi`);
      fetchProducts(pagination.page);
      
    } catch (err: any) {
      toast.error('Durum güncellenemedi');
    }
  };

  /**
   * 💰 FORMAT CURRENCY
   */
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  /**
   * 📅 FORMAT DATE
   */
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  if (loading && products.length === 0) {
    return <Loading fullScreen message="Ürünler yükleniyor..." />;
  }

  return (
    <div className="space-y-6">
      {/* 📌 HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Ürün Yönetimi
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Toplam {pagination.totalProducts} ürün
          </p>
        </div>
        
        <Link to="/admin/products/new">
          <Button>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Ürün Ekle
          </Button>
        </Link>
      </div>

      {/* 🔍 FILTERS */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Ürün ara (isim, açıklama)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tüm Kategoriler</option>
            <option value="electronics">Elektronik</option>
            <option value="clothing">Giyim</option>
            <option value="books">Kitap</option>
          </select>
          
          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tüm Stoklar</option>
            <option value="in-stock">Stokta Var</option>
            <option value="out-of-stock">Stokta Yok</option>
          </select>
        </div>
      </div>

      {/* 📋 PRODUCTS TABLE */}
      {error ? (
        <ErrorMessage message={error} onRetry={() => fetchProducts(pagination.page)} />
      ) : products.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Ürün bulunamadı</h3>
          <p className="mt-2 text-sm text-gray-600">Filtreleri değiştirin veya yeni ürün ekleyin</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ürün
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fiyat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Stok
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
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                    {/* Ürün */}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img
                          src={product.images.find(img => img.isMain)?.url || product.images[0]?.url}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.brand.name}</div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Kategori */}
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {product.category.name}
                    </td>
                    
                    {/* Fiyat */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(product.discountedPrice || product.price)}
                      </div>
                      {product.discountedPrice && (
                        <div className="text-xs text-gray-500 line-through">
                          {formatCurrency(product.price)}
                        </div>
                      )}
                    </td>
                    
                    {/* Stok */}
                    <td className="px-6 py-4">
                      <span className={`
                        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${product.stock > 10 ? 'bg-green-100 text-green-800' : 
                          product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}
                      `}>
                        {product.stock} adet
                      </span>
                    </td>
                    
                    {/* Durum */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleProductStatus(product._id, product.isActive)}
                        className={`
                          inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                        `}
                      >
                        {product.isActive ? 'Aktif' : 'Pasif'}
                      </button>
                    </td>
                    
                    {/* İşlemler */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/products/${product._id}/edit`}
                          className="text-blue-600 hover:text-blue-700 p-1"
                          title="Düzenle"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => {
                            setProductToDelete(product._id);
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
          
          {/* 📄 PAGINATION */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Sayfa {pagination.page} / {pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchProducts(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Önceki
                  </button>
                  <button
                    onClick={() => fetchProducts(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Sonraki
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🗑️ DELETE MODAL */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Ürünü Sil
            </h3>
            <p className="text-gray-600 mb-6">
              Bu ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setProductToDelete(null);
                }}
              >
                İptal
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteProduct}
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

export default AdminProductsPage;

/**
 * 💡 PRO TIP: Tablo Best Practices
 * 
 * 1. Görsel öncelik (resim, renk)
 * 2. Hızlı işlem butonları
 * 3. Filtreleme ve arama
 * 4. Pagination (performans)
 * 5. Loading states
 * 6. Empty state (ürün yoksa)
 */