// frontend/src/features/admin/pages/OrdersManagementPage.tsx

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '@/shared/services/api/client';
import { ORDER_ENDPOINTS } from '@/shared/services/api/endpoints';
import { Loading, ErrorMessage } from '@/shared/components/ui/feedback';
import { Button } from '@/shared/components/ui/base';

/**
 * 🎓 ÖĞREN: Sipariş Yönetimi
 * * Admin siparişleri görüntüler ve durumlarını günceller.
 * * Özellikler:
 * - Sipariş listesi
 * - Durum filtreleme
 * - Durum güncelleme (pending → shipped → delivered)
 * - Sipariş detay modal
 * - Arama (sipariş no, müşteri)
 */

// ==================================================================
// DÜZELTME 1: Arayüzler (Interface) API ile uyumlu hale getirildi
// ==================================================================
interface OrderItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  orderItems: OrderItem[]; // 'items' -> 'orderItems' olarak düzeltildi
  totalPrice: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
  };
  createdAt: string;
}
// ==================================================================

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  /**
   * 📊 FETCH ORDERS
   */
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {};
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (searchQuery) params.search = searchQuery;

      const response = await apiClient.get(ORDER_ENDPOINTS.ADMIN_LIST, { params });
      setOrders(response.data.data.orders);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Siparişler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus, searchQuery]);

  /**
   * 🔄 UPDATE ORDER STATUS
   */
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await apiClient.patch(ORDER_ENDPOINTS.ADMIN_UPDATE_STATUS(orderId), {
        status: newStatus,
      });
      toast.success('Sipariş durumu güncellendi');
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Durum güncellenemedi');
    }
  };

  /**
   * 🎨 STATUS CONFIG
   */
  const statusConfig: Record<string, { label: string; color: string; next?: string }> = {
    pending: { label: 'Beklemede', color: 'bg-yellow-100 text-yellow-800', next: 'processing' },
    processing: { label: 'Hazırlanıyor', color: 'bg-blue-100 text-blue-800', next: 'shipped' },
    shipped: { label: 'Kargoda', color: 'bg-purple-100 text-purple-800', next: 'delivered' },
    delivered: { label: 'Teslim Edildi', color: 'bg-green-100 text-green-800' },
    cancelled: { label: 'İptal', color: 'bg-red-100 text-red-800' },
  };

  /**
   * 📅 FORMAT DATE
   */
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
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

  if (loading && orders.length === 0) {
    return <Loading fullScreen message="Siparişler yükleniyor..." />;
  }

  return (
    <div className="space-y-6">
      {/* 📌 HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Sipariş Yönetimi
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Toplam {orders.length} sipariş
        </p>
      </div>

      {/* 🔍 FILTERS */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Sipariş no veya müşteri ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="pending">Beklemede</option>
            <option value="processing">Hazırlanıyor</option>
            <option value="shipped">Kargoda</option>
            <option value="delivered">Teslim Edildi</option>
            <option value="cancelled">İptal</option>
          </select>
        </div>
      </div>

      {/* 📋 ORDERS LIST */}
      {error ? (
        <ErrorMessage message={error} onRetry={fetchOrders} />
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center">
          <p className="text-gray-500">Sipariş bulunamadı</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sipariş No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Müşteri
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ürün Sayısı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tutar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      #{order.orderNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {order.user?.firstName} {order.user?.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{order.user?.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {/* ================================================= */}
                      {/* DÜZELTME 2: 'items' -> 'orderItems'               */}
                      {/* ================================================= */}
                      {order.orderItems?.length ?? 0} ürün
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(order.totalPrice)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[order.status].color}`}>
                        {statusConfig[order.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setDetailModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 p-1"
                          title="Detay"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>

                        {statusConfig[order.status].next && (
                          <button
                            onClick={() => updateOrderStatus(order._id, statusConfig[order.status].next!)}
                            className="text-green-600 hover:text-green-700 p-1"
                            title="Sonraki Aşama"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 📄 ORDER DETAIL MODAL */}
      {detailModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Sipariş Detayı #{selectedOrder.orderNumber}
                </h2>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Müşteri Bilgileri */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Müşteri</h3>
                <p className="text-sm text-gray-700">
                  {selectedOrder.user?.firstName} {selectedOrder.user?.lastName}
                </p>
                <p className="text-sm text-gray-500">{selectedOrder.user?.email}</p>
              </div>

              {/* Teslimat Adresi */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Teslimat Adresi</h3>
                <p className="text-sm text-gray-700">{selectedOrder.shippingAddress.fullName}</p>
                <p className="text-sm text-gray-700">{selectedOrder.shippingAddress.phone}</p>
                <p className="text-sm text-gray-700">{selectedOrder.shippingAddress.address}</p>
                <p className="text-sm text-gray-700">
                  {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.postalCode}
                </p>
              </div>

              {/* Ürünler */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Ürünler</h3>
                <div className="space-y-3">
                  {/* ================================================= */}
                  {/* DÜZELTME 3: 'items' -> 'orderItems'               */}
                  {/* ================================================= */}
                  {selectedOrder.orderItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      {/* ================================================= */}
                      {/* DÜZELTME 4: Ürün detayları düzeltildi              */}
                      {/* ================================================= */}
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">Adet: {item.quantity}</p>
                      </div>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Toplam */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Toplam</span>
                  <span className="text-xl font-bold text-blue-600">
                    {formatCurrency(selectedOrder.totalPrice)}
                  </span>
                </div>
              </div>

              {/* Durum Güncelleme */}
              {statusConfig[selectedOrder.status].next && (
                <div className="mt-6">
                  <Button
                    fullWidth
                    onClick={() => {
                      updateOrderStatus(selectedOrder._id, statusConfig[selectedDOrder.status].next!);
                      setDetailModalOpen(false);
                    }}
                  >
                    Sonraki Aşamaya Geçir: {statusConfig[statusConfig[selectedOrder.status].next!].label}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;