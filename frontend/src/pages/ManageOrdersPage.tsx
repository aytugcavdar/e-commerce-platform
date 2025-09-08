import React, { useState } from 'react';
import { useGetOrdersQuery, useUpdateOrderStatusMutation } from '../features/orders/ordersApiSlice';
import { useGetUserByIdQuery } from '../features/users/usersApiSlice';
import { Eye, Edit, Package, Truck, CheckCircle, XCircle, Clock, User } from 'lucide-react';

// Order tipi (basitleştirilmiş)
interface Order {
  _id: string;
  userId: string;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  orderItems: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
}

// Müşteri bilgilerini gösteren bileşen
const CustomerInfo: React.FC<{ userId: string }> = ({ userId }) => {
  const { data: userResponse, isLoading, error } = useGetUserByIdQuery(userId);
  
  if (isLoading) {
    return <span className="text-gray-500 animate-pulse">Yükleniyor...</span>;
  }
  
  if (error || !userResponse?.data) {
    return <span className="text-red-500">Kullanıcı bulunamadı</span>;
  }
  
  const user = userResponse.data;
  
  return (
    <div className="flex items-center space-x-2">
      <User className="w-4 h-4 text-gray-400" />
      <span className="font-medium">
        {user.firstName} {user.lastName}
      </span>
      <span className="text-sm text-gray-500">
        ({user.email})
      </span>
    </div>
  );
};

const ManageOrdersPage: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Orders'ları al (gerçek API'den)
  const { data: ordersResponse, isLoading, error, refetch } = useGetOrdersQuery();
  const [updateOrderStatus] = useUpdateOrderStatusMutation();

  // Mock data - gerçek API gelene kadar
  const mockOrders: Order[] = [
    {
      _id: '1',
      userId: '64a123456789abcd12345678',
      totalAmount: 299.99,
      status: 'pending',
      createdAt: '2025-01-15T10:30:00Z',
      shippingAddress: {
        street: 'Atatürk Cad. No: 123',
        city: 'İstanbul',
        state: 'İstanbul',
        zipCode: '34000',
        country: 'Türkiye'
      },
      orderItems: [
        { productId: 'p1', quantity: 2, price: 149.99 }
      ]
    },
    {
      _id: '2',
      userId: '64a123456789abcd12345679',
      totalAmount: 599.99,
      status: 'processing',
      createdAt: '2025-01-14T14:20:00Z',
      shippingAddress: {
        street: 'Cumhuriyet Mah. 456 Sok.',
        city: 'Ankara',
        state: 'Ankara',
        zipCode: '06000',
        country: 'Türkiye'
      },
      orderItems: [
        { productId: 'p2', quantity: 1, price: 599.99 }
      ]
    },
    {
      _id: '3',
      userId: '64a123456789abcd12345680',
      totalAmount: 899.99,
      status: 'shipped',
      createdAt: '2025-01-13T09:15:00Z',
      shippingAddress: {
        street: 'Barbaros Bulvarı No: 789',
        city: 'İzmir',
        state: 'İzmir',
        zipCode: '35000',
        country: 'Türkiye'
      },
      orderItems: [
        { productId: 'p3', quantity: 1, price: 899.99 }
      ]
    }
  ];

  const orders = ordersResponse?.data || mockOrders;

  // Filtrelenmiş siparişler
  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return <Package className="w-4 h-4 text-blue-500" />;
      case 'shipped':
        return <Truck className="w-4 h-4 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1";
    
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'processing':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'shipped':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'delivered':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusText = (status: string) => {
    const statusTexts: { [key: string]: string } = {
      pending: 'Bekliyor',
      processing: 'İşleniyor',
      shipped: 'Kargoda',
      delivered: 'Teslim Edildi',
      cancelled: 'İptal Edildi'
    };
    return statusTexts[status] || status;
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus({ orderId, status: newStatus }).unwrap();
      refetch();
    } catch (error) {
      console.error('Status güncellenirken hata oluştu:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sayfa Başlığı */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sipariş Yönetimi</h1>
          <p className="mt-2 text-gray-600">
            Tüm siparişleri görüntüleyin ve yönetin
          </p>
        </div>
      </div>

      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex space-x-4">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tüm Siparişler</option>
            <option value="pending">Bekliyor</option>
            <option value="processing">İşleniyor</option>
            <option value="shipped">Kargoda</option>
            <option value="delivered">Teslim Edildi</option>
            <option value="cancelled">İptal Edildi</option>
          </select>
        </div>
      </div>

      {/* Siparişler Tablosu */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{order._id.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <CustomerInfo userId={order.userId} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₺{order.totalAmount.toLocaleString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadge(order.status)}>
                      {getStatusIcon(order.status)}
                      <span>{getStatusText(order.status)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 inline-flex items-center space-x-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Görüntüle</span>
                    </button>
                    
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                      className="ml-2 text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="pending">Bekliyor</option>
                      <option value="processing">İşleniyor</option>
                      <option value="shipped">Kargoda</option>
                      <option value="delivered">Teslim Edildi</option>
                      <option value="cancelled">İptal Edildi</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Sipariş Bulunamadı
            </h3>
            <p className="text-gray-500">
              Seçilen kriterlere uygun sipariş bulunmuyor.
            </p>
          </div>
        )}
      </div>

      {/* Sipariş Detay Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex justify-between items-center pb-4 border-b">
                <h3 className="text-lg font-bold text-gray-900">
                  Sipariş Detayı #{selectedOrder._id.slice(-8).toUpperCase()}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="mt-4 space-y-6">
                {/* Müşteri Bilgileri */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Müşteri Bilgileri</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <CustomerInfo userId={selectedOrder.userId} />
                  </div>
                </div>

                {/* Sipariş Bilgileri */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Sipariş Bilgileri</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Sipariş Tarihi:</span>
                      <p>{formatDate(selectedOrder.createdAt)}</p>
                    </div>
                    <div>
                      <span className="font-medium">Toplam Tutar:</span>
                      <p className="text-lg font-bold">₺{selectedOrder.totalAmount.toLocaleString('tr-TR')}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Durum:</span>
                      <div className="mt-1">
                        <span className={getStatusBadge(selectedOrder.status)}>
                          {getStatusIcon(selectedOrder.status)}
                          <span>{getStatusText(selectedOrder.status)}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Teslimat Adresi */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Teslimat Adresi</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <p>{selectedOrder.shippingAddress.street}</p>
                    <p>
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}
                    </p>
                    <p>{selectedOrder.shippingAddress.country}</p>
                  </div>
                </div>

                {/* Sipariş Ürünleri */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Sipariş Ürünleri</h4>
                  <div className="space-y-2">
                    {selectedOrder.orderItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">Ürün ID: {item.productId}</p>
                          <p className="text-sm text-gray-600">Adet: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₺{item.price.toLocaleString('tr-TR')}</p>
                          <p className="text-sm text-gray-600">
                            Toplam: ₺{(item.price * item.quantity).toLocaleString('tr-TR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-6 pt-4 border-t flex justify-end space-x-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Kapat
                </button>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => {
                    handleStatusUpdate(selectedOrder._id, e.target.value);
                    setIsModalOpen(false);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Bekliyor</option>
                  <option value="processing">İşleniyor</option>
                  <option value="shipped">Kargoda</option>
                  <option value="delivered">Teslim Edildi</option>
                  <option value="cancelled">İptal Edildi</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageOrdersPage;