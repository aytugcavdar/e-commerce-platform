// frontend/src/features/products/pages/ProductsPage.tsx

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useProducts } from '../hooks/useProducts';
import { useProductFilters } from '../hooks/useProductFilters'; // ✅ EKLENDİ
import { useCart } from '@/features/cart/hooks/useCart';
import ProductList from '../components/ProductList';
import ProductFilters from '../components/ProductFilters';
import { Container } from '@/shared/components/layout';
import { Button } from '@/shared/components/ui/base';
import type { Product } from '../types/product.types';

/**
 * 🎓 ÖĞREN: ProductsPage (Düzeltilmiş Versiyon)
 * 
 * Değişiklikler:
 * 1. useProductFilters hook'u eklendi (URL senkronizasyonu için)
 * 2. URL parametreleri otomatik olarak filtrelere çevriliyor
 * 3. Filtreleme ve listeleme çalışıyor
 */
const ProductsPage = () => {
  const [searchParams] = useSearchParams();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // ✅ URL yönetimi için useProductFilters
  const { filters, hasActiveFilters, activeFilterCount, updateFilter } = useProductFilters();

  // ✅ Ürün listesi ve sepet
  const {
    products,
    loading,
    error,
    pagination,
    loadProducts,
    clearError,
  } = useProducts();

  const { addItem } = useCart();

  /**
   * 🎯 URL değiştiğinde ürünleri yükle
   * 
   * ✅ filters değiştiğinde otomatik olarak API çağrısı yapılır
   */
  useEffect(() => {
    console.log('🔄 Filters changed, loading products:', filters);
    
    // Ürünleri yükle
    loadProducts(filters).then(result => {
      if (result.success) {
        console.log('✅ Products loaded successfully:', result.data.products.length, 'items');
      } else {
        console.error('❌ Failed to load products:', result.error);
      }
    });
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.page, 
    filters.limit, 
    filters.sort,      // ✅ Sort değişince tetiklenir
    filters.search, 
    filters.category, 
    filters.brand, 
    filters.minPrice, 
    filters.maxPrice, 
    filters.inStock,
    filters.isFeatured,
    filters.status,
    filters.tags
  ]); // ✅ Specific dependencies

  /**
   * 🛒 Sepete Ekleme Handler'ı
   */
  const handleAddToCart = (product: Product) => {
    addItem(product, 1);
    toast.success(`${product.name} sepete eklendi! 🎉`, {
      duration: 2000,
      position: 'top-right',
    });
  };

  /**
   * 📄 Sayfa değiştirme
   * 
   * ✅ updateFilter kullanarak URL güncellenir
   */
  const handlePageChange = (newPage: number) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updateFilter('page', newPage); // ✅ FİX: URL'i güncelle
  };

  /**
   * 🔄 Sıralama değiştirme
   */
  const handleSortChange = (sort: string) => {
    updateFilter('sort', sort as any); // ✅ FİX: URL'i güncelle
  };

  /**
   * ❌ Hata mesajını temizle
   */
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        {/* 📱 Mobil Filtre Butonu */}
        <div className="lg:hidden mb-4">
          <Button
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            variant="outline"
            fullWidth
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtreler {isMobileFilterOpen ? '▲' : '▼'}
            {hasActiveFilters && (
              <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 🎨 Sol Sidebar - Filtreler */}
          <aside className={`lg:block ${isMobileFilterOpen ? 'block' : 'hidden'}`}>
            {/* ✅ ProductFilters artık useProductFilters ile çalışıyor */}
            <ProductFilters />
          </aside>

          {/* 📦 Sağ İçerik - Ürün Listesi */}
          <main className="lg:col-span-3">
            {/* 📊 Başlık ve Sonuç Sayısı */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Ürünler
                </h1>
                {!loading && (
                  <p className="text-gray-600">
                    {pagination.total} ürün bulundu
                    {hasActiveFilters && ` (${activeFilterCount} filtre aktif)`}
                  </p>
                )}
              </div>

              {/* 🔄 Sıralama (Mobilde de görünsün) */}
              <div className="w-48">
                <select
                  value={filters.sort || 'newest'}
                  onChange={(e) => {
                    const newSort = e.target.value;
                    console.log('🔄 Sort dropdown changed to:', newSort);
                    handleSortChange(newSort);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="newest">En Yeni</option>
                  <option value="oldest">En Eski</option>
                  <option value="price-asc">Fiyat: Düşük → Yüksek</option>
                  <option value="price-desc">Fiyat: Yüksek → Düşük</option>
                  <option value="name-asc">İsim: A → Z</option>
                  <option value="name-desc">İsim: Z → A</option>
                  <option value="popular">En Popüler</option>
                </select>
              </div>
            </div>

            {/* ❌ Hata Mesajı */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-800">Bir hata oluştu</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                  <button
                    onClick={clearError}
                    className="ml-auto text-red-600 hover:text-red-800"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* 🛍️ Ürün Listesi */}
            <ProductList
              products={products}
              loading={loading}
              onAddToCart={handleAddToCart}
            />

            {/* 📄 Pagination */}
            {!loading && products.length > 0 && (
              <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
                {/* Sayfa Bilgisi */}
                <div className="flex-1 flex justify-between sm:hidden">
                  <Button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrevPage}
                    variant="outline"
                  >
                    Önceki
                  </Button>
                  <Button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNextPage}
                    variant="outline"
                  >
                    Sonraki
                  </Button>
                </div>

                {/* Desktop Pagination */}
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span>
                      {' '}-{' '}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                      </span>
                      {' '}arası gösteriliyor (toplam{' '}
                      <span className="font-medium">{pagination.total}</span> ürün)
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      {/* Önceki Sayfa */}
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={!pagination.hasPrevPage}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      {/* Sayfa Numaraları */}
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === pagination.page
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}

                      {/* Sonraki Sayfa */}
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={!pagination.hasNextPage}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </Container>
    </div>
  );
};

export default ProductsPage;