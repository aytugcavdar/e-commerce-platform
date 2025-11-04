// frontend/src/features/products/pages/ProductDetailPage.tsx

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/ProductCard';
import { Container } from '@/shared/components/layout';
import { Button } from '@/shared/components/ui/base';
import { Loading, ErrorMessage } from '@/shared/components/ui/feedback';

/**
 * 🎓 ÖĞREN: ProductDetailPage
 * 
 * Ürün detay sayfası. Tek bir ürünün tüm bilgilerini gösterir.
 * 
 * Sorumlulukları:
 * 1. URL'den slug parametresini al
 * 2. Ürün detayını API'den çek
 * 3. Resim galerisi, açıklama, özellikler göster
 * 4. İlgili ürünler (related products) göster
 * 5. Sepete ekleme butonu
 */
const ProductDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const {
    selectedProduct: product,
    loadingProduct,
    productError,
    relatedProducts,
    loadProductBySlug,
    loadRelated,
    clearProduct,
  } = useProducts();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  /**
   * 🎯 Ürünü yükle
   */
  useEffect(() => {
    if (slug) {
      loadProductBySlug(slug).then((result) => {
        if (result.success && result.data) {
          // İlgili ürünleri de yükle
          loadRelated(result.data._id, 6);
        }
      });
    }

    // Cleanup: Sayfa kapanınca seçili ürünü temizle
    return () => {
      clearProduct();
    };
  }, [slug]);

  /**
   * 📦 Sepete Ekle
   */
  const handleAddToCart = () => {
    if (!product) return;
    
    // TODO: Faz 4'te cart'a ekleme yapılacak
    console.log('Sepete eklendi:', product.name, 'Adet:', quantity);
    alert(`${quantity} adet ${product.name} sepete eklendi! (Cart feature Faz 4'te eklenecek)`);
  };

  /**
   * ➕➖ Adet Artır/Azalt
   */
  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && product && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  /**
   * 🔄 Loading State
   */
  if (loadingProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading message="Ürün yükleniyor..." />
      </div>
    );
  }

  /**
   * ❌ Error State
   */
  if (productError) {
    return (
      <Container className="py-20">
        <ErrorMessage
          title="Ürün Yüklenemedi"
          message={productError}
          onRetry={() => slug && loadProductBySlug(slug)}
        />
        <div className="text-center mt-6">
          <Button onClick={() => navigate('/products')}>
            Ürünlere Dön
          </Button>
        </div>
      </Container>
    );
  }

  /**
   * 🚫 Ürün Bulunamadı
   */
  if (!product) {
    return (
      <Container className="py-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ürün Bulunamadı</h2>
          <p className="text-gray-600 mb-6">Aradığınız ürün mevcut değil veya kaldırılmış olabilir.</p>
          <Button onClick={() => navigate('/products')}>
            Ürünlere Dön
          </Button>
        </div>
      </Container>
    );
  }

  const mainImage = product.images?.[selectedImageIndex] || product.images?.[0];
  const finalPrice = product.discountPrice || product.price;
  const hasDiscount = !!product.discountPrice;
  const discountPercentage = hasDiscount
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0;
  const isOutOfStock = product.stock === 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        {/* 🍞 Breadcrumb */}
        <nav className="mb-6 flex items-center space-x-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-blue-600">Ana Sayfa</Link>
          <span>›</span>
          <Link to="/products" className="hover:text-blue-600">Ürünler</Link>
          <span>›</span>
          {product.category && (
            <>
              <Link to={`/products?category=${product.category._id}`} className="hover:text-blue-600">
                {product.category.name}
              </Link>
              <span>›</span>
            </>
          )}
          <span className="text-gray-900">{product.name}</span>
        </nav>

        {/* 🎨 Ana İçerik */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* 🖼️ Sol: Resim Galerisi */}
            <div>
              {/* Ana Resim */}
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                {mainImage ? (
                  <img
                    src={mainImage.url}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Küçük Resimler */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                        idx === selectedImageIndex
                          ? 'border-blue-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={`${product.name} ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 📝 Sağ: Ürün Bilgileri */}
            <div>
              {/* Marka */}
              {product.brand && (
                <Link
                  to={`/products?brand=${product.brand._id}`}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium uppercase tracking-wide"
                >
                  {product.brand.name}
                </Link>
              )}

              {/* Ürün Adı */}
              <h1 className="text-3xl font-bold text-gray-900 mt-2 mb-4">
                {product.name}
              </h1>

              {/* Fiyat */}
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  {finalPrice.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-xl text-gray-400 line-through">
                      {product.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                    </span>
                    <span className="px-2 py-1 bg-red-500 text-white text-sm font-bold rounded">
                      -{discountPercentage}%
                    </span>
                  </>
                )}
              </div>

              {/* Stok Durumu */}
              <div className="mb-6">
                {isOutOfStock ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    <span className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                    Stokta Yok
                  </span>
                ) : product.stock <= 5 ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                    <span className="w-2 h-2 rounded-full bg-orange-500 mr-2" />
                    Son {product.stock} ürün!
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                    Stokta var
                  </span>
                )}
              </div>

              {/* Açıklama */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Ürün Açıklaması</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>

              {/* Adet Seçimi */}
              {!isOutOfStock && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adet
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        if (val >= 1 && val <= product.stock) setQuantity(val);
                      }}
                      className="w-20 h-10 text-center border border-gray-300 rounded-lg"
                      min="1"
                      max={product.stock}
                    />
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= product.stock}
                      className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                    <span className="text-sm text-gray-500 ml-2">
                      (Maks. {product.stock} adet)
                    </span>
                  </div>
                </div>
              )}

              {/* Sepete Ekle */}
              <div className="flex gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  fullWidth
                  className="py-4 text-lg"
                >
                  {isOutOfStock ? 'Stokta Yok' : 'Sepete Ekle'}
                </Button>
                <button className="w-14 h-14 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>

              {/* Özellikler */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Özellikler</h2>
                  <dl className="space-y-3">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex">
                        <dt className="w-1/3 text-sm font-medium text-gray-500">{key}</dt>
                        <dd className="w-2/3 text-sm text-gray-900">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* Kargo Bilgisi */}
              {product.shipping && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm">
                      {product.shipping.freeShipping ? (
                        <p className="text-blue-800 font-medium">Ücretsiz Kargo</p>
                      ) : (
                        <p className="text-blue-800">
                          Kargo Ücreti: {product.shipping.shippingCost?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 🔗 İlgili Ürünler */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Benzer Ürünler
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct._id}
                  product={relatedProduct}
                  onAddToCart={(p) => {
                    console.log('İlgili ürün sepete eklendi:', p.name);
                    alert(`${p.name} sepete eklendi!`);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

export default ProductDetailPage;

/**
 * 🎯 ÖZELLİKLER:
 * 
 * ✅ Resim Galerisi: Küçük resimlere tıklayarak ana resmi değiştir
 * ✅ Breadcrumb: Navigasyon kolaylığı
 * ✅ Adet Seçimi: +/- butonları ve input
 * ✅ Stok Kontrolü: Yetersiz stokta uyarı
 * ✅ İndirim Hesaplaması: İndirim yüzdesi ve orijinal fiyat
 * ✅ İlgili Ürünler: Aynı kategorideki diğer ürünler
 * ✅ Özellikler: Key-value formatında teknik detaylar
 * ✅ Kargo Bilgisi: Ücretsiz kargo/kargo ücreti
 * ✅ Favori Butonu: (Şimdilik sadece ikon, Faz 5'te işlevsel)
 * 
 * 🚀 GELİŞTİRME FIRSATLARI:
 * - Zoom özelliği (resim üzerine tıklayınca büyüt)
 * - Yorumlar ve değerlendirmeler
 * - Paylaşım butonları (sosyal medya)
 * - "Son görüntülenen ürünler" listesi
 * - Ürün karşılaştırma özelliği
 */