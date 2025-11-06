// frontend/src/features/admin/pages/DashboardPage.tsx

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '@/shared/services/api/client';
import { Loading, ErrorMessage } from '@/shared/components/ui/feedback';

/**
 * 🎓 ÖĞREN: Admin Dashboard Nedir?
 * 
 * Dashboard, admin panelinin ana sayfasıdır.
 * Önemli metrikleri ve istatistikleri gösterir.
 * 
 * İçerik:
 * - Stat Cards (Toplam ürün, sipariş, kullanıcı, gelir)
 * - Son Siparişler
 * - Düşük Stok Uyarıları
 * - Popüler Ürünler
 */

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  todayOrders: number;
  pendingOrders: number;
}

interface RecentOrder {
  _id: string;
  orderNumber: string;
  user: {
    firstName: string;
    lastName: string;
  };
  totalPrice: number;
  status: string;
  createdAt: string;
}

const AdminDashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 📊 FETCH DASHBOARD DATA
   * 
   * API'den dashboard verilerini çek
   */
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // İstatistikleri çek
        const statsResponse = await apiClient.get('/orders/admin/stats');
        setStats(statsResponse.data.data);
        
        // Son siparişleri çek
        const ordersResponse = await apiClient.get('/orders/admin/all', {
          params: { limit: 5, sort: '-createdAt' }
        });
        setRecentOrders(ordersResponse.data.data);
        
      } catch (err: any) {
        setError(err.response?.data?.message || 'Veriler yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  /**
   * 🎨 STATUS COLOR
   * Sipariş durumuna göre renk
   */
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  /**
   * 📅 FORMAT DATE
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
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

  if (loading) {
    return <Loading fullScreen message="Dashboard yükleniyor..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Hata"
        message={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 📊 STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Toplam Ürün */}
        <StatCard
          title="Toplam Ürün"
          value={stats?.totalProducts || 0}
          icon="📦"
          color="bg-blue-500"
          link="/admin/products"
        />

        {/* Toplam Sipariş */}
        <StatCard
          title="Toplam Sipariş"
          value={stats?.totalOrders || 0}
          icon="🛒"
          color="bg-green-500"
          link="/admin/orders"
          badge={`${stats?.todayOrders || 0} bugün`}
        />

        {/* Toplam Kullanıcı */}
        <StatCard
          title="Toplam Kullanıcı"
          value={stats?.totalUsers || 0}
          icon="👥"
          color="bg-purple-500"
          link="/admin/users"
        />

        {/* Toplam Gelir */}
        <StatCard
          title="Toplam Gelir"
          value={formatCurrency(stats?.totalRevenue || 0)}
          icon="💰"
          color="bg-yellow-500"
          badge={`${stats?.pendingOrders || 0} beklemede`}
        />
      </div>

      {/* 📋 SON SİPARİŞLER */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Son Siparişler
          </h2>
          <Link
            to="/admin/orders"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Tümünü Gör →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Henüz sipariş yok
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sipariş No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Müşteri
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tutar
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Durum
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tarih
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      #{order.orderNumber}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {order.user.firstName} {order.user.lastName}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(order.totalPrice)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`
                          inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${getStatusColor(order.status)}
                        `}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 🚀 HIZLI ERİŞİM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickActionCard
          title="Yeni Ürün Ekle"
          description="Mağazaya yeni ürün ekleyin"
          icon="➕"
          link="/admin/products/new"
        />
        <QuickActionCard
          title="Siparişleri Yönet"
          description="Bekleyen siparişleri inceleyin"
          icon="📦"
          link="/admin/orders"
          badge={stats?.pendingOrders}
        />
        <QuickActionCard
          title="Kullanıcıları Gör"
          description="Tüm kullanıcıları listeleyin"
          icon="👥"
          link="/admin/users"
        />
      </div>
    </div>
  );
};

/**
 * 📊 STAT CARD COMPONENT
 */
interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  link?: string;
  badge?: string;
}

const StatCard = ({ title, value, icon, color, link, badge }: StatCardProps) => {
  const CardContent = (
    <>
      <div className="flex items-center justify-between">
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center text-2xl`}>
          {icon}
        </div>
        {badge && (
          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
            {badge}
          </span>
        )}
      </div>
      <h3 className="mt-4 text-sm font-medium text-gray-600">{title}</h3>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </>
  );

  if (link) {
    return (
      <Link
        to={link}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
      >
        {CardContent}
      </Link>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {CardContent}
    </div>
  );
};

/**
 * 🚀 QUICK ACTION CARD
 */
interface QuickActionCardProps {
  title: string;
  description: string;
  icon: string;
  link: string;
  badge?: number;
}

const QuickActionCard = ({ title, description, icon, link, badge }: QuickActionCardProps) => {
  return (
    <Link
      to={link}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start justify-between">
        <div className="text-3xl">{icon}</div>
        {badge !== undefined && badge > 0 && (
          <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
            {badge}
          </span>
        )}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
        {title}
      </h3>
      <p className="mt-1 text-sm text-gray-600">{description}</p>
    </Link>
  );
};

export default AdminDashboardPage;

/**
 * 💡 PRO TIP: Dashboard Best Practices
 * 
 * 1. Önemli metrikleri üstte göster
 * 2. Gerçek zamanlı veri (auto-refresh)
 * 3. Hızlı aksiyon butonları
 * 4. Görsel grafikler (charts)
 * 5. Son aktiviteler
 */