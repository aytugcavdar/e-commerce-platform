// frontend/src/features/orders/pages/OrdersPage.tsx

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrders } from '../hooks/useOrders';
import { Container } from '@/shared/components/layout';
import { Button } from '@/shared/components/ui/base';
import { Loading, ErrorMessage } from '@/shared/components/ui/feedback';
import { ORDER_STATUS_MAP, type OrderStatus } from '../types/order.types';
import type { Order } from '../types/order.types';

/**
 * 🎓 ÖĞREN: OrdersPage
 * 
 * Kullanıcının tüm siparişlerini listeleyen sayfa.
 * 
 * Özellikler:
 * - Sipariş listesi
 * - Durum filtresi
 * - Sayfalama
 * - Sipariş detayına git
 */

const OrdersPage = () => {
  const {
    orders,
    loading,
    error,
    pagination,
    loadOrders,
    updateFilters,
    clearOrderError,
  } = useOrders();

  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');

  /**
   * 📋 İlk Yükleme
   */
  useEffect(() => {
    loadOrders({ page: 1, limit: 10 });
  }, [loadOrders]);

  /**
   * 🔍 Durum Filtresi Değişti
   */
  const handleStatusChange = (status: OrderStatus | 'all') => {
    setSelectedStatus(status);
    
    if (status === 'all') {
      loadOrders({ page: 1, limit: 10 });
    } else {
      loadOrders({ page: 1, limit: 10, status });
    }
  };

  /**
   * 📄 Sayfa Değiştir
   */
  const handlePageChange = (page: number) => {
    const params: any = { page, limit: 10 };
    if (selectedStatus !== 'all') {
      params.status = selectedStatus;
    }
    loadOrders(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * 🔄 Loading State
   */
  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading message="Siparişler yükleniyor..." />
      </div>
    );
  }

  /**
   * ❌ Error State
   */
  if (error && orders.length === 0) {
    return (
      <Container className="py-20">
        <ErrorMessage
          title="Siparişler Yüklenemedi"
          message={error}
          onRetry={() => {
            clearOrderError();
            loadOrders();
          }}
        />
      </Container>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        {/* 🍞 Breadcrumb */}
        <nav className="mb-6 flex items-center space-x-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-blue-600">Ana Sayfa</Link>
          <span>›</span>
          <span className="text-gray-900">Siparişlerim</span>
        </nav>

        {/* 📊 Başlık */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Siparişlerim
            </h1>
            <p className="text-gray-600">
              {pagination.total} sipariş bulundu
            </p>
          </div>
        </div>

        {/* 🔍 Durum Filtreleri */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => handleStatusChange('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Tümü ({pagination.total})
          </button>

          {Object.entries(ORDER_STATUS_MAP).map(([key, statusInfo]) => (
            <button
              key={key}
              onClick={() => handleStatusChange(key as OrderStatus)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedStatus === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {statusInfo.icon} {statusInfo.label}
            </button>
          ))}
        </div>

        {/* 📦 Sipariş Listesi */}
        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}

            {/* 📄 Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <Button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  variant="outline"
                >
                  ← Önceki
                </Button>

                <span className="flex items-center px-4 text-gray-700">
                  Sayfa {pagination.page} / {pagination.totalPages}
                </span>

                <Button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  variant="outline"
                >
                  Sonraki →
                </Button>
              </div>
            )}
          </div>
        ) : (
          // 🚫 Sipariş Yok
          <div className="text-center py-16 bg-white rounded-lg">
            <svg
              className="w-24 h-24 mx-auto text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Henüz Siparişiniz Yok
            </h2>
            <p className="text-gray-600 mb-6">
              İlk siparişinizi vermek için alışverişe başlayın!
            </p>
            <Link to="/products">
              <Button size="lg">
                Alışverişe Başla
              </Button>
            </Link>
          </div>
        )}
      </Container>
    </div>
  );
};

/**
 * 📦 ORDER CARD - Sipariş Kartı Component
 */
interface OrderCardProps {
  order: Order;
}

const OrderCard = ({ order }: OrderCardProps) => {
  const statusInfo = ORDER_STATUS_MAP[order.status];

  // Tarih formatlama
  const orderDate = new Date(order.createdAt).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Link
      to={`/orders/${order._id}`}
      className="block bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow p-6"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Sol: Sipariş Bilgileri */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            {/* Sipariş Numarası */}
            <h3 className="text-lg font-bold text-gray-900">
              {order.orderNumber || `#${order._id.slice(-8)}`}
            </h3>

            {/* Durum Badge */}
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}
            >
              {statusInfo.icon} {statusInfo.label}
            </span>
          </div>

          {/* Sipariş Tarihi */}
          <p className="text-sm text-gray-500 mb-3">
            📅 {orderDate}
          </p>

          {/* Ürünler */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {/* DÜZELTİLMİŞ YERLER */}
            <span className="font-medium">{order.orderItems.length} ürün</span>
            <span>•</span>
            <span className="text-gray-500">
              {order.orderItems.slice(0, 2).map(item => item.name).join(', ')}
              {order.orderItems.length > 2 && ` +${order.orderItems.length - 2} ürün`}
            </span>
          </div>
        </div>

        {/* Sağ: Fiyat ve Detay */}
        <div className="flex items-center gap-6">
          {/* Toplam Fiyat */}
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">Toplam</p>
            <p className="text-2xl font-bold text-gray-900">
              {(order.totalPrice ?? 0).toLocaleString('tr-TR', {
                style: 'currency',
                currency: 'TRY',
              })}
            </p>
          </div>

          {/* Detay Butonu */}
          <div>
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default OrdersPage;

/**
 * 🎯 KULLANIM SENARYOLARI:
 * 
 * 1. Kullanıcı "Siparişlerim"e tıklar
 * 2. OrdersPage açılır, tüm siparişler listelenir
 * 3. Kullanıcı durum filtresi seçer (örn: "Kargoya Verildi")
 * 4. Sadece o durumdaki siparişler gösterilir
 * 5. Kullanıcı bir siparişe tıklar
 * 6. OrderDetailPage açılır
 */