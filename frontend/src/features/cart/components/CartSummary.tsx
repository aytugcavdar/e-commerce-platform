// frontend/src/features/cart/components/CartSummary.tsx

import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { CartSummary as CartSummaryType, CouponCode } from '../types/cart.types';
import { Button } from '@/shared/components/ui/base';

/**
 * 🎓 ÖĞREN: CartSummary Component
 * 
 * Sepet özeti ve fiyat hesaplama component'i.
 * 
 * Özellikler:
 * - Ara toplam, kargo, vergi gösterimi
 * - Kupon kodu uygulama
 * - Ücretsiz kargo bilgisi
 * - Ödeme sayfasına yönlendirme
 */

interface CartSummaryProps {
  summary: CartSummaryType;
  coupon: CouponCode | null;
  onApplyCoupon?: (code: string) => Promise<void>;
  onRemoveCoupon?: () => void;
  isCheckoutPage?: boolean;
}

const CartSummary = ({
  summary,
  coupon,
  onApplyCoupon,
  onRemoveCoupon,
  isCheckoutPage = false,
}: CartSummaryProps) => {
  const [couponCode, setCouponCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [couponError, setCouponError] = useState('');

  /**
   * 🎟️ Kupon Kodu Uygula
   */
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Lütfen bir kupon kodu girin');
      return;
    }

    if (!onApplyCoupon) return;

    setIsApplying(true);
    setCouponError('');

    try {
      await onApplyCoupon(couponCode.trim().toUpperCase());
      setCouponCode('');
    } catch (error: any) {
      setCouponError(error.message || 'Geçersiz kupon kodu');
    } finally {
      setIsApplying(false);
    }
  };

  /**
   * 📊 Ücretsiz Kargoya Ne Kadar Kaldı?
   */
  const freeShippingThreshold = 200;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - summary.subtotal);
  const hasFreeShipping = summary.shipping === 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Sipariş Özeti
      </h2>

      {/* 📊 Fiyat Detayları */}
      <div className="space-y-3 mb-6">
        {/* Ara Toplam */}
        <div className="flex justify-between text-gray-700">
          <span>Ara Toplam</span>
          <span className="font-medium">
            {summary.subtotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          </span>
        </div>

        {/* Kargo */}
        <div className="flex justify-between text-gray-700">
          <span>Kargo</span>
          <span className={`font-medium ${hasFreeShipping ? 'text-green-600' : ''}`}>
            {hasFreeShipping ? (
              'Ücretsiz'
            ) : (
              summary.shipping.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
            )}
          </span>
        </div>

        {/* Vergi (KDV) */}
        <div className="flex justify-between text-gray-700">
          <span>KDV (%20)</span>
          <span className="font-medium">
            {summary.tax.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          </span>
        </div>

        {/* İndirim (Kupon) */}
        {summary.discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>İndirim</span>
            <span className="font-medium">
              -{summary.discount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
            </span>
          </div>
        )}

        {/* Ücretsiz Kargo Bildirimi */}
        {!hasFreeShipping && remainingForFreeShipping > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <p className="text-blue-800">
              🚚 <span className="font-semibold">
                {remainingForFreeShipping.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
              </span>
              {' '}daha alışveriş yapın, <span className="font-semibold">kargo bedava!</span>
            </p>
          </div>
        )}

        {/* Ayırıcı Çizgi */}
        <div className="border-t border-gray-200 my-4"></div>

        {/* Toplam */}
        <div className="flex justify-between text-lg font-bold text-gray-900">
          <span>Toplam</span>
          <span className="text-2xl">
            {summary.total.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          </span>
        </div>
      </div>

      {/* 🎟️ Kupon Kodu Bölümü */}
      {!isCheckoutPage && (
        <div className="mb-6">
          {coupon ? (
            // Kupon uygulandı
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-green-800">
                    Kupon Uygulandı: {coupon.code}
                  </p>
                  <p className="text-xs text-green-600">
                    {coupon.type === 'percentage' ? `%${coupon.value}` : `${coupon.value} TL`} indirim
                  </p>
                </div>
              </div>
              {onRemoveCoupon && (
                <button
                  onClick={onRemoveCoupon}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Kaldır
                </button>
              )}
            </div>
          ) : (
            // Kupon giriş formu
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kupon Kodunuz Var mı?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponError('');
                  }}
                  placeholder="KUPON20"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                  disabled={isApplying}
                />
                <Button
                  onClick={handleApplyCoupon}
                  disabled={!couponCode.trim() || isApplying}
                  isLoading={isApplying}
                  variant="outline"
                >
                  Uygula
                </Button>
              </div>
              {couponError && (
                <p className="mt-1 text-sm text-red-600">{couponError}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 🛒 Ödeme Butonu */}
      {!isCheckoutPage ? (
        <Link to="/checkout">
          <Button fullWidth size="lg">
            Ödemeye Geç
          </Button>
        </Link>
      ) : (
        <Button fullWidth size="lg" type="submit">
          Siparişi Tamamla
        </Button>
      )}

      {/* 🔒 Güvenli Ödeme Bildirimi */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>Güvenli ödeme garantisi</span>
      </div>

      {/* 💳 Kabul Edilen Kartlar */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center mb-2">Kabul Edilen Ödeme Yöntemleri</p>
        <div className="flex justify-center gap-2">
          {['Visa', 'Mastercard', 'American Express', 'Troy'].map((card) => (
            <div
              key={card}
              className="px-2 py-1 bg-gray-100 rounded text-xs font-semibold text-gray-600"
            >
              {card}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CartSummary;

/**
 * 🎯 KULLANIM ÖRNEKLERİ:
 * 
 * // 1. CartPage'de
 * import CartSummary from '@/features/cart/components/CartSummary';
 * import { useCart } from '@/features/cart/hooks/useCart';
 * 
 * const CartPage = () => {
 *   const { summary, coupon, applyCouponCode, removeCouponCode } = useCart();
 *   
 *   const handleApplyCoupon = async (code: string) => {
 *     // Backend'den kupon doğrula
 *     const response = await apiClient.post('/cart/validate-coupon', { code });
 *     applyCouponCode(response.data.data);
 *   };
 *   
 *   return (
 *     <CartSummary
 *       summary={summary}
 *       coupon={coupon}
 *       onApplyCoupon={handleApplyCoupon}
 *       onRemoveCoupon={removeCouponCode}
 *     />
 *   );
 * };
 * 
 * // 2. CheckoutPage'de
 * const CheckoutPage = () => {
 *   return (
 *     <CartSummary
 *       summary={summary}
 *       coupon={coupon}
 *       isCheckoutPage={true}
 *     />
 *   );
 * };
 */

/**
 * 💡 PRO TIP: Kupon Kodu Validasyonu
 * 
 * Backend'de kupon doğrulama endpoint'i:
 * 
 * POST /api/cart/validate-coupon
 * {
 *   "code": "INDIRIM20",
 *   "subtotal": 250
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "code": "INDIRIM20",
 *     "type": "percentage",
 *     "value": 20,
 *     "isValid": true,
 *     "minAmount": 100,
 *     "discount": 50
 *   }
 * }
 */