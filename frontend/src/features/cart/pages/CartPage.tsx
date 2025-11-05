// frontend/src/features/cart/pages/CartPage.tsx

import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useCart } from '../hooks/useCart';
import CartItem from '../components/CartItem';
import CartSummary from '../components/CartSummary';
import { Container } from '@/shared/components/layout';
import { Button } from '@/shared/components/ui/base';
import apiClient from '@/shared/services/api/client';

/**
 * 🎓 ÖĞREN: CartPage
 * 
 * Sepet sayfası. Kullanıcının sepetindeki ürünleri listeler.
 * 
 * Özellikler:
 * - Sepetteki ürünleri listeleme
 * - Ürün adedi artırma/azaltma
 * - Ürün çıkarma
 * - Sepeti temizleme
 * - Kupon kodu uygulama
 * - Ödeme sayfasına yönlendirme
 * - Boş sepet durumu
 */

const CartPage = () => {
  const {
    items,
    summary,
    coupon,
    isEmpty,
    totalItems,
    incrementItem,
    decrementItem,
    removeItem,
    updateItemQuantity,
    clear,
    applyCouponCode,
    removeCouponCode,
  } = useCart();

  /**
   * 🗑️ Sepeti Temizle
   */
  const handleClearCart = () => {
    if (window.confirm('Sepetinizdeki tüm ürünler silinecek. Emin misiniz?')) {
      clear();
      toast.success('Sepet temizlendi');
    }
  };

  /**
   * 🗑️ Ürün Çıkar
   */
  const handleRemoveItem = (productId: string) => {
    removeItem(productId);
    toast.success('Ürün sepetten çıkarıldı');
  };

  /**
   * 🎟️ Kupon Kodu Uygula
   */
  const handleApplyCoupon = async (code: string) => {
    try {
      // Backend'den kupon doğrula
      const { data } = await apiClient.post('/cart/validate-coupon', {
        code,
        subtotal: summary.subtotal,
      });

      if (data.success) {
        applyCouponCode(data.data);
        toast.success('Kupon kodu uygulandı!');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Geçersiz kupon kodu';
      toast.error(message);
      throw new Error(message);
    }
  };

  /**
   * 🎟️ Kupon Kodunu Kaldır
   */
  const handleRemoveCoupon = () => {
    removeCouponCode();
    toast.info('Kupon kodu kaldırıldı');
  };

  /**
   * 🚫 Boş Sepet Durumu
   */
  if (isEmpty) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <Container>
          <div className="max-w-md mx-auto text-center">
            {/* Boş Sepet İkonu */}
            <div className="mb-6">
              <svg
                className="w-32 h-32 mx-auto text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>

            {/* Başlık */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Sepetiniz Boş
            </h1>

            {/* Açıklama */}
            <p className="text-gray-600 mb-8">
              Henüz sepetinize ürün eklemediniz.
              Alışverişe başlamak için ürünlerimize göz atın!
            </p>

            {/* Alışverişe Başla Butonu */}
            <Link to="/products">
              <Button size="lg">
                Alışverişe Başla
              </Button>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  /**
   * ✅ Sepet Dolu Durumu
   */
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        {/* 🍞 Breadcrumb */}
        <nav className="mb-6 flex items-center space-x-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-blue-600">Ana Sayfa</Link>
          <span>›</span>
          <span className="text-gray-900">Sepetim</span>
        </nav>

        {/* 📊 Başlık ve Temizle Butonu */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Sepetim
            </h1>
            <p className="text-gray-600">
              {totalItems} ürün sepetinizde
            </p>
          </div>

          <Button
            onClick={handleClearCart}
            variant="outline"
            className="text-red-600 border-red-600 hover:bg-red-50"
          >
            Sepeti Temizle
          </Button>
        </div>

        {/* 📦 İçerik: Ürünler + Özet */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sol: Ürün Listesi */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <CartItem
                key={item.productId}
                item={item}
                onIncrement={incrementItem}
                onDecrement={decrementItem}
                onRemove={handleRemoveItem}
                onQuantityChange={updateItemQuantity}
              />
            ))}

            {/* 🔙 Alışverişe Devam Et */}
            <div className="pt-4">
              <Link to="/products">
                <Button variant="outline" fullWidth>
                  ← Alışverişe Devam Et
                </Button>
              </Link>
            </div>
          </div>

          {/* Sağ: Sepet Özeti */}
          <div>
            <CartSummary
              summary={summary}
              coupon={coupon}
              onApplyCoupon={handleApplyCoupon}
              onRemoveCoupon={handleRemoveCoupon}
            />

            {/* 💡 Güvenlik Bildirimleri */}
            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Ücretsiz kargo (200 TL üzeri)</span>
              </div>

              <div className="flex items-start gap-3 text-sm text-gray-600">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>14 gün içinde ücretsiz iade</span>
              </div>

              <div className="flex items-start gap-3 text-sm text-gray-600">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Güvenli ödeme garantisi</span>
              </div>
            </div>
          </div>
        </div>

        {/* 🎁 Önerilen Ürünler (Opsiyonel) */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            İlginizi Çekebilecek Ürünler
          </h2>
          <p className="text-gray-600">
            Önerilen ürünler yakında eklenecek...
          </p>
        </div>
      </Container>
    </div>
  );
};

export default CartPage;

/**
 * 🎯 KULLANIM SENARYOLARI:
 * 
 * 1. Kullanıcı sepetine ürün ekler
 * 2. CartPage açılır
 * 3. Kullanıcı ürün adedini değiştirir
 * 4. Kupon kodu dener
 * 5. "Ödemeye Geç" butonuna tıklar
 * 6. CheckoutPage'e yönlendirilir
 */

/**
 * 💡 PRO TIP: Sepet Validasyonu
 * 
 * Checkout'a geçmeden önce sepeti doğrula:
 * 
 * const validateCart = async () => {
 *   try {
 *     const { data } = await apiClient.post('/cart/validate', {
 *       items: items.map(item => ({
 *         productId: item.productId,
 *         quantity: item.quantity
 *       }))
 *     });
 *     
 *     if (!data.success) {
 *       // Stok veya fiyat değişikliği varsa kullanıcıyı bilgilendir
 *       toast.error('Bazı ürünlerde değişiklik var');
 *       updateStock(data.data);
 *     }
 *   } catch (error) {
 *     toast.error('Sepet doğrulanamadı');
 *   }
 * };
 */