// frontend/src/features/orders/pages/OrderDetailPage.tsx

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useOrders } from '../hooks/useOrders';
import { Container } from '@/shared/components/layout';
import { Button } from '@/shared/components/ui/base';
import { Loading, ErrorMessage } from '@/shared/components/ui/feedback';
import { ORDER_STATUS_MAP } from '../types/order.types';

const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    selectedOrder: order,
    loadingDetails,
    orderError,
    loadOrderDetails,
    cancelOrderById,
    clearOrder,
  } = useOrders();

  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (id) {
      loadOrderDetails(id);
    }
    return () => {
      clearOrder();
    };
  }, [id]);

  const handleCancelOrder = async () => {
    if (!order) return;

    if (!window.confirm('Siparişi iptal etmek istediğinize emin misiniz?')) {
      return;
    }

    setIsCancelling(true);
    const result = await cancelOrderById(order._id);
    setIsCancelling(false);

    if (result.success) {
      toast.success('Sipariş iptal edildi');
    } else {
      toast.error(result.error || 'Sipariş iptal edilemedi');
    }
  };

  if (loadingDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading message="Sipariş yükleniyor..." />
      </div>
    );
  }

  if (orderError) {
    return (
      <Container className="py-20">
        <ErrorMessage
          title="Sipariş Yüklenemedi"
          message={orderError}
          onRetry={() => id && loadOrderDetails(id)}
        />
        <div className="text-center mt-6">
          <Button onClick={() => navigate('/orders')}>
            Siparişlere Dön
          </Button>
        </div>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="py-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Sipariş Bulunamadı
          </h2>
          <Button onClick={() => navigate('/orders')}>
            Siparişlere Dön
          </Button>
        </div>
      </Container>
    );
  }

  const statusInfo = ORDER_STATUS_MAP[order.status];
  const canCancel = ['pending', 'confirmed', 'processing'].includes(order.status);

  const orderDate = new Date(order.createdAt).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center space-x-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-blue-600">Ana Sayfa</Link>
          <span>›</span>
          <Link to="/orders" className="hover:text-blue-600">Siparişlerim</Link>
          <span>›</span>
          <span className="text-gray-900">{order.orderNumber}</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Sipariş {order.orderNumber}
            </h1>
            <p className="text-gray-600">{orderDate}</p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}
            >
              {statusInfo.icon} {statusInfo.label}
            </span>

            {canCancel && (
              <Button
                onClick={handleCancelOrder}
                variant="outline"
                isLoading={isCancelling}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                Siparişi İptal Et
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sol: Ürünler ve Adres */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ürünler */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Sipariş Edilen Ürünler
              </h2>

              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0"
                  >
                    <Link
                      to={`/products/${item.slug}`}
                      className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden"
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </Link>

                    <div className="flex-1">
                      <Link
                        to={`/products/${item.slug}`}
                        className="font-semibold text-gray-900 hover:text-blue-600 line-clamp-2"
                      >
                        {item.name}
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">
                        Adet: {item.quantity}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {formatCurrency(item.price)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Toplam: {formatCurrency(item.subtotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Teslimat Adresi */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Teslimat Adresi
              </h2>
              <div className="text-gray-700 space-y-1">
                <p className="font-semibold">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.phone}</p>
                <p>{order.shippingAddress.address}</p>
                <p>
                  {order.shippingAddress.district}, {order.shippingAddress.city}{' '}
                  {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </div>

            {/* Kargo Takip */}
            {order.trackingNumber && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Kargo Takip
                </h2>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-1">Takip Numarası</p>
                    <p className="font-mono font-semibold text-gray-900">
                      {order.trackingNumber}
                    </p>
                    {order.carrier && (
                      <p className="text-sm text-gray-500 mt-1">{order.carrier}</p>
                    )}
                  </div>
                  <Button variant="outline" size="sm">
                    Takip Et
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Sağ: Özet */}
          <div>
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Sipariş Özeti
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-700">
                  <span>Ara Toplam</span>
                  <span className="font-medium">{formatCurrency(order.subtotal)}</span>
                </div>

                <div className="flex justify-between text-gray-700">
                  <span>Kargo</span>
                  <span className="font-medium">
                    {order.shippingCost === 0 ? (
                      <span className="text-green-600">Ücretsiz</span>
                    ) : (
                      formatCurrency(order.shippingCost)
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-gray-700">
                  <span>KDV</span>
                  <span className="font-medium">{formatCurrency(order.tax)}</span>
                </div>

                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>İndirim</span>
                    <span className="font-medium">-{formatCurrency(order.discount)}</span>
                  </div>
                )}

                <div className="border-t border-gray-200 my-4"></div>

                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Toplam</span>
                  <span className="text-2xl">{formatCurrency(order.total)}</span>
                </div>
              </div>

              {/* Ödeme Bilgisi */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Ödeme Yöntemi
                </h3>
                <p className="text-gray-700">
                  {order.paymentMethod.type === 'credit_card' && '💳 Kredi Kartı'}
                  {order.paymentMethod.type === 'debit_card' && '💳 Banka Kartı'}
                  {order.paymentMethod.type === 'bank_transfer' && '🏦 Havale/EFT'}
                  {order.paymentMethod.type === 'cash_on_delivery' && '💵 Kapıda Ödeme'}
                </p>
                {order.paymentMethod.cardNumber && (
                  <p className="text-sm text-gray-500 mt-1">
                    {order.paymentMethod.cardNumber}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default OrderDetailPage;