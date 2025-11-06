// frontend/src/shared/components/layout/AdminLayout.tsx

import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import Container from './Container';

/**
 * 🎓 ÖĞREN: Admin Layout Nedir?
 * 
 * Admin Layout, admin paneline özel bir layout'tur.
 * Normal kullanıcı layout'undan farklıdır.
 * 
 * Özellikleri:
 * - Sol tarafta Sidebar (menü)
 * - Üstte Header (kullanıcı bilgisi, çıkış)
 * - Ortada Content (sayfa içeriği)
 * - Responsive (mobilde sidebar gizlenir)
 * 
 * Yapısı:
 * +------------------+
 * |   Admin Header   |
 * +-----+------------+
 * | Sb  |  Content   |
 * | ar  |            |
 * +-----+------------+
 */

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // Sidebar açık/kapalı durumu (mobil için)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  /**
   * 📱 SIDEBAR TOGGLE
   * Mobilde sidebar'ı aç/kapat
   */
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  /**
   * 🚪 LOGOUT HANDLER
   */
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  /**
   * 📋 MENU ITEMS
   * Admin panelindeki tüm menü öğeleri
   */
  const menuItems = [
    {
      name: 'Dashboard',
      path: '/admin',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: 'Ürünler',
      path: '/admin/products',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      name: 'Siparişler',
      path: '/admin/orders',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      name: 'Kullanıcılar',
      path: '/admin/users',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
  ];

  /**
   * ✅ ACTIVE LINK CHECK
   * Mevcut sayfa ile menü öğesini karşılaştır
   */
  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 🔝 ADMIN HEADER */}
      <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-30">
        <Container>
          <div className="flex items-center justify-between h-16">
            {/* Logo + Hamburger */}
            <div className="flex items-center gap-4">
              {/* Hamburger Menu (Mobile) */}
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Logo */}
              <Link to="/admin" className="flex items-center gap-2">
                <div className="bg-blue-600 text-white rounded-lg p-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-900 hidden sm:inline">
                  Admin Panel
                </span>
              </Link>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              {/* Ana Siteye Dön */}
              <Link
                to="/"
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors hidden sm:block"
              >
                ← Ana Siteye Dön
              </Link>

              {/* User Info */}
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.role}
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                  {user?.firstName?.charAt(0)}
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Çıkış Yap"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </Container>
      </header>

      {/* 📱 MOBILE SIDEBAR OVERLAY */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* 📂 SIDEBAR */}
      <aside
        className={`
          fixed top-16 left-0 bottom-0 w-64 bg-white shadow-lg z-40
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                ${
                  isActive(item.path)
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* 📄 MAIN CONTENT */}
      <main className="lg:ml-64 pt-16">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;

/**
 * 🎯 KULLANIM (routes/index.tsx):
 * 
 * <Route path="/admin" element={<AdminRoute />}>
 *   <Route element={<AdminLayout />}>
 *     <Route index element={<AdminDashboardPage />} />
 *     <Route path="products" element={<AdminProductsPage />} />
 *     <Route path="orders" element={<AdminOrdersPage />} />
 *     <Route path="users" element={<AdminUsersPage />} />
 *   </Route>
 * </Route>
 */

/**
 * 💡 PRO TIP: Layout Özellikleri
 * 
 * 1. Fixed Header - Üstte sabit
 * 2. Fixed Sidebar - Solda sabit (desktop)
 * 3. Responsive - Mobilde hamburger menü
 * 4. Active Link - Aktif sayfa vurgulanır
 * 5. User Menu - Kullanıcı bilgisi ve çıkış
 */

/**
 * 🔥 BEST PRACTICE: Admin Layout vs Public Layout
 * 
 * Admin Layout:
 * - Sidebar menü
 * - Minimalist header
 * - Daha fazla bilgi yoğunluğu
 * - İstatistik kartları
 * 
 * Public Layout:
 * - Top navigation
 * - Büyük header (logo, arama)
 * - Footer
 * - Görsel öncelikli
 */