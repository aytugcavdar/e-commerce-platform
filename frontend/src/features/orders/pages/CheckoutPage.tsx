// frontend/src/features/orders/pages/CheckoutPage.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useCart } from '@/features/cart/hooks/useCart';
import { useOrders } from '@/features/orders/hooks/useOrders';
import { useAuth } from '@/features/auth/hooks/useAuth';
import CartSummary from '@/features/cart/components/CartSummary';
import { Container } from '@/shared/components/layout';
import { Button, Input } from '@/shared/components/ui/base';
import { Loading } from '@/shared/components/ui/feedback';
// order.types.ts'den ShippingAddress ve PaymentMethodType'ı import ettiğimizi varsayıyoruz
// (Bir önceki turda bu dosyanın içeriğini görmüştük)
import type { ShippingAddress, PaymentMethodType } from '../types/order.types';

/**
 * 🎓 ÖĞREN: CheckoutPage
 * * Ödeme sayfası. Kullanıcı teslimat adresi ve ödeme yöntemi seçer.
 * * Adımlar:
 * 1. Teslimat Adresi
 * 2. Ödeme Yöntemi
 * 3. Sipariş Özeti
 * 4. Sipariş Oluştur
 */

// Frontend'in state'i için arayüz (district içerebilir)
interface CheckoutShippingAddress {
  fullName: string;
  phone: string;
  address: string; // 'addressLine1' için
  city: string;
  district: string; // 'state' için
  postalCode: string;
  country: string;
}

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, summary, coupon, isEmpty } = useCart();
  const { createNewOrder, creatingOrder } = useOrders();

  // Teslimat Adresi
  const [shippingAddress, setShippingAddress] = useState<CheckoutShippingAddress>({
    fullName: user?.firstName + ' ' + user?.lastName || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    district: '',
    postalCode: '',
    country: 'Türkiye',
  });

  // Ödeme Yöntemi
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('credit_card');

  // Not
  const [notes, setNotes] = useState('');

  /**
   * 🚫 Sepet Boşsa Ana Sayfaya Yönlendir
   */
  useEffect(() => {
    if (isEmpty) {
      toast.error('Sepetiniz boş!');
      navigate('/');
    }
  }, [isEmpty, navigate]);

  /**
   * 📝 Form Validasyonu
   */
  const validateForm = (): boolean => {
  if (!shippingAddress.fullName.trim()) {
    toast.error('Ad Soyad giriniz');
    return false;
  }
  if (!shippingAddress.phone.trim()) {
    toast.error('Telefon numarası giriniz');
    return false;
  }
  if (!shippingAddress.address.trim()) {
    toast.error('Adres giriniz');
    return false;
  }
  if (!shippingAddress.city.trim()) {
    toast.error('İl seçiniz');
    return false;
  }
  if (!shippingAddress.district.trim()) {
    toast.error('İlçe giriniz');
    return false;
  }
  if (!shippingAddress.postalCode.trim()) {  // ✅ EKLENDİ
    toast.error('Posta kodu giriniz');
    return false;
  }
  return true;
};

  /**
   * 🛒 Sipariş Oluştur
   */
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) return;

  const orderData = {
    items: items.map(item => ({
      product: item.productId,
      quantity: item.quantity,
    })),
    shippingAddress: {
      fullName: shippingAddress.fullName,
      phone: shippingAddress.phone,
      addressLine1: shippingAddress.address,
      addressLine2: '',
      city: shippingAddress.city,
      state: shippingAddress.district,
      postalCode: shippingAddress.postalCode,
      country: shippingAddress.country,
    },
    paymentMethod: paymentMethod,
    couponCode: coupon?.code,
    notes: notes.trim() || undefined,
  };

  const result = await createNewOrder(orderData);

  if (result.success) {
    toast.success('Sipariş oluşturuldu! 🎉');
    navigate(`/orders/${result.data._id}`);
  } else {
    // ✅ Backend'den gelen hata mesajını göster
    const errorMessage = result.error?.message || 'Sipariş oluşturulamadı';
    toast.error(errorMessage);
    
    // Stok hatası varsa detayları göster
    if (result.error?.data?.unavailableItems) {
      console.error('Stokta olmayan ürünler:', result.error.data.unavailableItems);
    }
  }
};

  if (isEmpty) {
    return <Loading fullScreen message="Yönlendiriliyor..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        {/* 🍞 Breadcrumb */}
        <nav className="mb-6 flex items-center space-x-2 text-sm text-gray-500">
          <a href="/" className="hover:text-blue-600">Ana Sayfa</a>
          <span>›</span>
          <a href="/cart" className="hover:text-blue-600">Sepet</a>
          <span>›</span>
          <span className="text-gray-900">Ödeme</span>
        </nav>

        {/* 📊 Başlık */}
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Ödeme
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sol: Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* 🚚 Teslimat Adresi */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  1. Teslimat Adresi
                </h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Ad Soyad *"
                      value={shippingAddress.fullName}
                      onChange={(e) => setShippingAddress(prev => ({
                        ...prev,
                        fullName: e.target.value
                      }))}
                      required
                      fullWidth
                    />

                    <Input
                      label="Telefon *"
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress(prev => ({
                        ...prev,
                        phone: e.target.value
                      }))}
                      placeholder="5551234567"
                      required
                      fullWidth
                    />
                  </div>

                  <Input
                    label="Adres *"
                    value={shippingAddress.address}
                    onChange={(e) => setShippingAddress(prev => ({
                      ...prev,
                      address: e.target.value
                    }))}
                    placeholder="Mahalle, cadde, sokak, bina no"
                    required
                    fullWidth
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="İl *"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress(prev => ({
                        ...prev,
                        city: e.target.value
                      }))}
                      required
                      fullWidth
                    />

                    <Input
                      label="İlçe *"
                      value={shippingAddress.district}
                      onChange={(e) => setShippingAddress(prev => ({
                        ...prev,
                        district: e.target.value
                      }))}
                      required
                      fullWidth
                    />

                    <Input
                      label="Posta Kodu *"
                      value={shippingAddress.postalCode}
                      onChange={(e) => setShippingAddress(prev => ({
                        ...prev,
                        postalCode: e.target.value
                      }))}
                      placeholder="34000"
                      required // required eklendi
                      fullWidth
                    />
                  </div>
                </div>
              </div>

              {/* 💳 Ödeme Yöntemi */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  2. Ödeme Yöntemi
                </h2>

                <div className="space-y-3">
                  {[
                    { value: 'credit_card', label: 'Kredi Kartı', icon: '💳' },
                    { value: 'debit_card', label: 'Banka Kartı', icon: '💳' },
                    { value: 'bank_transfer', label: 'Havale/EFT', icon: '🏦' },
                    { value: 'cash_on_delivery', label: 'Kapıda Ödeme', icon: '💵' },
                  ].map((method) => (
                    <label
                      key={method.value}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === method.value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.value}
                        checked={paymentMethod === method.value}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="ml-3 text-2xl">{method.icon}</span>
                      <span className="ml-2 font-medium text-gray-900">{method.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 📝 Sipariş Notu */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  3. Sipariş Notu (Opsiyonel)
                </h2>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Siparişiniz hakkında not ekleyebilirsiniz..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Sağ: Sipariş Özeti */}
            <div>
              <CartSummary
                summary={summary}
                coupon={coupon}
                isCheckoutPage={true}
              />

              {/* Sipariş Tamamla Butonu */}
              <Button
                type="submit"
                fullWidth
                size="lg"
                isLoading={creatingOrder}
                disabled={creatingOrder}
                className="mt-4"
              >
                {creatingOrder ? 'Sipariş Oluşturuluyor...' : 'Siparişi Tamamla'}
              </Button>

              {/* Güvenlik Bildirimi */}
              <p className="mt-4 text-xs text-center text-gray-500">
                Ödeme bilgileriniz 256-bit SSL ile şifrelenir
              </p>
            </div>
          </div>
        </form>
      </Container>
    </div>
  );
};

export default CheckoutPage;