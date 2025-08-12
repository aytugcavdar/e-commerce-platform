import React from "react";
import Card from "../components/common/Card";

const AdminDashboard: React.FC = () => {
  const dashboardItems = [
    {
      to: "/admin/products",
      title: "Ürünleri Yönet",
      description: "Yeni ürün ekle, mevcut ürünleri düzenle veya sil.",
      icon: "📦",
      color: "bg-gradient-to-br from-blue-500 to-blue-600"
    },
    {
      to: "/admin/categories",
      title: "Kategorileri Yönet",
      description: "Ürün kategorilerini yönet ve düzenle.",
      icon: "📋",
      color: "bg-gradient-to-br from-green-500 to-green-600"
    },
    {
      to: "/admin/orders",
      title: "Siparişleri Yönet",
      description: "Müşteri siparişlerini görüntüle ve yönet.",
      icon: "🛒",
      color: "bg-gradient-to-br from-purple-500 to-purple-600"
    },
     {
      to: "/admin/users", 
      title: "Kullanıcıları Yönet",
      description: "Müşteri hesaplarını yönet ve düzenle.",
      icon: "👥",
      color: "bg-gradient-to-br from-orange-500 to-orange-600"
    },
    {
      to: "/admin/analytics",
      title: "İstatistikler",
      description: "Satış ve performans raporlarını görüntüle.",
      icon: "📊",
      color: "bg-gradient-to-br from-pink-500 to-pink-600"
    },
    {
      to: "/admin/settings",
      title: "Ayarlar",
      description: "Site ayarlarını ve konfigürasyonları yönet.",
      icon: "⚙️",
      color: "bg-gradient-to-br from-indigo-500 to-indigo-600"
    }
  ];

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary to-secondary text-primary-content py-12 mb-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">Yönetim Paneli</h1>
            <p className="text-xl opacity-90">Mağazanızı buradan yönetin</p>
          </div>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="container mx-auto px-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="stat bg-base-200 rounded-lg shadow">
            <div className="stat-figure text-primary">
              <div className="text-2xl">📦</div>
            </div>
            <div className="stat-title">Toplam Ürün</div>
            <div className="stat-value text-primary">150</div>
            <div className="stat-desc">Son ayda +12%</div>
          </div>

          <div className="stat bg-base-200 rounded-lg shadow">
            <div className="stat-figure text-secondary">
              <div className="text-2xl">🛒</div>
            </div>
            <div className="stat-title">Aktif Sipariş</div>
            <div className="stat-value text-secondary">23</div>
            <div className="stat-desc">Bugün +3</div>
          </div>

          <div className="stat bg-base-200 rounded-lg shadow">
            <div className="stat-figure text-success">
              <div className="text-2xl">💰</div>
            </div>
            <div className="stat-title">Günlük Satış</div>
            <div className="stat-value text-success">₺2,580</div>
            <div className="stat-desc">Dün +8%</div>
          </div>

          <div className="stat bg-base-200 rounded-lg shadow">
            <div className="stat-figure text-info">
              <div className="text-2xl">👥</div>
            </div>
            <div className="stat-title">Toplam Müşteri</div>
            <div className="stat-value text-info">89</div>
            <div className="stat-desc">Bu ay +7</div>
          </div>
        </div>

        {/* Management Cards */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Yönetim Araçları</h2>
          <div className="w-16 h-1 bg-primary rounded-full mb-6"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {dashboardItems.map((item, index) => (
            <Card 
              key={index} 
              to={item.to}
              className="hover:scale-105 transition-all duration-300 border border-base-300"
            >
              <div className={`w-16 h-16 rounded-full ${item.color} flex items-center justify-center text-2xl mb-4 shadow-lg`}>
                {item.icon}
              </div>
              <h2 className="card-title text-xl mb-2">{item.title}</h2>
              <p className="text-base-content/70 text-sm text-center leading-relaxed">
                {item.description}
              </p>
              <div className="card-actions justify-center mt-4">
                <div className="btn btn-primary btn-sm btn-outline">
                  Yönet →
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Recent Activities */}
        <div className="bg-base-200 rounded-lg p-6 shadow-lg">
          <h3 className="text-xl font-bold mb-4">Son Aktiviteler</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-base-100 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-sm">Yeni sipariş alındı - #1234</span>
              </div>
              <span className="text-xs text-base-content/50">5 dakika önce</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-base-100 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-info rounded-full"></div>
                <span className="text-sm">Ürün stoku güncellendi - iPhone 13</span>
              </div>
              <span className="text-xs text-base-content/50">15 dakika önce</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-base-100 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-warning rounded-full"></div>
                <span className="text-sm">Yeni kullanıcı kaydı - john@example.com</span>
              </div>
              <span className="text-xs text-base-content/50">1 saat önce</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;