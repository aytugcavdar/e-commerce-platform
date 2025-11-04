// frontend/src/features/products/pages/ProductSearchPage.tsx

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import ProductList from '../components/ProductList';
import ProductSearch from '../components/ProductSearch';
import { Container } from '@/shared/components/layout';
import { Button } from '@/shared/components/ui/base';
import { Loading, ErrorMessage } from '@/shared/components/ui/feedback';

/**
 * 🎓 ÖĞREN: ProductSearchPage
 * 
 * Arama sonuçları sayfası.
 * URL: /products/search?q=iphone
 * 
 * ❓ ProductsPage'den Farkı:
 * - ProductsPage: Tüm ürünler + filtreler
 * - ProductSearchPage: Sadece arama sonuçları (daha basit UI)
 * 
 * 💡 Alternatif Yaklaşım:
 * ProductsPage'i kullanıp query parametresi ile arama yapabilirsin.
 * Bu sayfa opsiyoneldir, SEO ve UX için ayrı sayfa olması iyidir.
 */

const ProductSearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const {
    products,
    loading,
    error,
    pagination,
    loadProducts,
    changePage,
    clearError,
  } = useProducts();

  /**
   * 🔍 Arama Yap
   */
  useEffect(() => {
    if (query) {
      loadProducts({
        search: query,
        page: 1,
        limit: 20,
        sort: 'newest',
      });
    }
  }, [query, loadProducts]);

  /**
   * 📄 Sayfa Değiştir
   */
  const handlePageChange = (page: number) => {
    changePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        {/* 🔍 Arama Çubuğu */}
        <div className="mb-8">
          <ProductSearch autoFocus />
        </div>

        {/* 📊 Arama Sonucu Başlığı */}
        {query && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Arama Sonuçları
            </h1>
            {!loading && (
              <p className="text-gray-600">
                "<span className="font-semibold text-gray-900">{query}</span>" için{' '}
                <span className="font-semibold">{pagination.total}</span> ürün bulundu
              </p>
            )}
          </div>
        )}

        {/* ❌ Hata Mesajı */}
        {error && (
          <div className="mb-6">
            <ErrorMessage
              title="Arama Yapılamadı"
              message={error}
              onRetry={() => {
                clearError();
                loadProducts({ search: query });
              }}
            />
          </div>
        )}

        {/* 🔄 Loading State */}
        {loading && <Loading message="Ürünler aranıyor..." />}

        {/* ✅ Ürün Listesi */}
        {!loading && !error && (
          <>
            {products.length > 0 ? (
              <>
                <ProductList
                  products={products}
                  onAddToCart={(product) => {
                    console.log('Sepete eklendi:', product.name);
                    alert(`${product.name} sepete eklendi!`);
                  }}
                />

                {/* 📄 Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
                    {/* Sayfa Bilgisi */}
                    <div className="hidden sm:block">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">
                          {((pagination.page - 1) * pagination.limit) + 1}
                        </span>
                        {' '}-{' '}
                        <span className="font-medium">
                          {Math.min(pagination.page * pagination.limit, pagination.total)}
                        </span>
                        {' '}arası gösteriliyor (toplam{' '}
                        <span className="font-medium">{pagination.total}</span> ürün)
                      </p>
                    </div>

                    {/* Sayfa Butonları */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={!pagination.hasPrevPage}
                        variant="outline"
                      >
                        ← Önceki
                      </Button>

                      <Button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={!pagination.hasNextPage}
                        variant="outline"
                      >
                        Sonraki →
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // 🚫 Sonuç Bulunamadı
              <div className="text-center py-16">
                <svg
                  className="w-24 h-24 mx-auto text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Sonuç Bulunamadı
                </h2>
                <p className="text-gray-600 mb-6">
                  "<span className="font-semibold">{query}</span>" için sonuç bulunamadı.
                  Lütfen farklı bir arama yapın.
                </p>

                {/* 💡 Arama Önerileri */}
                <div className="max-w-md mx-auto text-left">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Arama İpuçları:
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                    <li>Daha kısa veya genel kelimeler kullanın</li>
                    <li>Farklı kelimeler deneyin</li>
                    <li>Yazım hatası olmadığından emin olun</li>
                    <li>Kategori bazlı arama yapın</li>
                  </ul>
                </div>

                {/* 🔗 Tüm Ürünler Butonu */}
                <div className="mt-8">
                  <Button
                    as="a"
                    href="/products"
                    variant="primary"
                  >
                    Tüm Ürünleri Görüntüle
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* 💡 Popüler Aramalar (Opsiyonel) */}
        {!query && (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Ne Aramak İstersiniz?
            </h2>
            <p className="text-gray-600 mb-8">
              Yukarıdaki arama çubuğunu kullanarak ürün arayabilirsiniz
            </p>

            {/* Popüler Aramalar */}
            <div className="flex flex-wrap justify-center gap-2">
              {[
                'iPhone',
                'Samsung',
                'Laptop',
                'Kulaklık',
                'Akıllı Saat',
                'Tablet',
              ].map((term) => (
                <a
                  key={term}
                  href={`/products/search?q=${encodeURIComponent(term)}`}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600 transition-colors"
                >
                  {term}
                </a>
              ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

export default ProductSearchPage;

/**
 * 🎯 ROUTE YAPISI:
 * 
 * // routes/index.tsx
 * import ProductSearchPage from '@/features/products/pages/ProductSearchPage';
 * 
 * <Route path="/products/search" element={<ProductSearchPage />} />
 * 
 * // Kullanım:
 * /products/search?q=iphone
 * /products/search?q=samsung+galaxy
 */

/**
 * 💡 PRO TIP: SEO Optimizasyonu
 * 
 * import { Helmet } from 'react-helmet-async';
 * 
 * <Helmet>
 *   <title>{query} - Ürün Arama Sonuçları</title>
 *   <meta name="description" content={`${query} için ${pagination.total} ürün bulundu`} />
 * </Helmet>
 */

/**
 * 🔥 BEST PRACTICE: Search Analytics
 * 
 * useEffect(() => {
 *   if (query) {
 *     // Google Analytics'e gönder
 *     gtag('event', 'search', {
 *       search_term: query,
 *       results_count: pagination.total,
 *     });
 *     
 *     // Kendi backend'ine kaydet (popüler aramalar için)
 *     apiClient.post('/analytics/search', { query });
 *   }
 * }, [query, pagination.total]);
 */