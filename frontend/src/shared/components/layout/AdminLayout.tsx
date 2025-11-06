// frontend/src/shared/components/layout/AdminLayout.tsx

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'react-hot-toast';

/**
 * 🎓 ÖĞREN: Admin Layout
 * 
 * Admin paneli için özel layout.
 * Sol sidebar + üst navbar + content area
 * 
 * Özellikler:
 * - Sidebar navigation (Products, Orders, Users)
 * - Top navbar (Search, Profile, Logout)
 * - Responsive design (Mobile'da sidebar toggle)
 * - Active route highlighting
 */

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /**
   * 🚪 LOGOUT HANDLER
   */
  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      toast.success('Çıkış yapıldı');
      navigate('/login');
    }
  };

  /**
   * 🎨 MENU ITEMS
   */
  const menuItems = [
    {
      title: 'Dashboard',
      icon: '📊',
      path: '/admin',
      badge: null,
    },
    {
      title: 'Ürünler',
      icon: '📦',
      path: '/admin/products',
      badge: null,
    },
    {
      title: 'Siparişler',
      icon: '🛒',
      path: '/admin/orders',
      badge: '5', // Örnek: Bekleyen sipariş sayısı
    },
    {
      title: 'Kullanıcılar',
      icon: '👥',
      path: '/admin/users',
      badge: null,
    },
  ];

  /**
   * 🎨 ACTIVE LINK CHECK
   */
  const isActiveLink = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 📱 MOBILE MENU OVERLAY */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* 🗂️ SIDEBAR */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen bg-white border-r border-gray-200
          transition-transform duration-300
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${sidebarOpen ? 'w-64' : 'w-20'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          {sidebarOpen && (
            <Link to="/admin" className="text-xl font-bold text-blue-600">
              Admin Panel
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 lg:block hidden"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                ${isActiveLink(item.path)
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
                }
              `}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && (
                <>
                  <span className="flex-1">{item.title}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <span className="text-xl">🚪</span>
            {sidebarOpen && <span>Çıkış Yap</span>}
          </button>
        </div>
      </aside>

      {/* 📄 MAIN CONTENT */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* 🔝 TOP NAVBAR */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Search Bar (Desktop) */}
          <div className="hidden lg:block flex-1 max-w-md">
            <input
              type="text"
              placeholder="Ara..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* User Info */}
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-lg hover:bg-gray-100 relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* 📄 CONTENT AREA */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

/**
 * 💡 PRO TIP: Sidebar State Persistence
 * 
 * Sidebar açık/kapalı durumunu localStorage'da sakla:
 * 
 * const [sidebarOpen, setSidebarOpen] = useState(() => {
 *   const saved = localStorage.getItem('admin-sidebar-open');
 *   return saved ? JSON.parse(saved) : true;
 * });
 * 
 * useEffect(() => {
 *   localStorage.setItem('admin-sidebar-open', JSON.stringify(sidebarOpen));
 * }, [sidebarOpen]);
 */

/**
 * 🔥 BEST PRACTICE: Breadcrumbs
 * 
 * Admin panelinde breadcrumbs ekle:
 * 
 * Dashboard > Ürünler > iPhone 15 Pro
 * 
 * Kullanıcı nerede olduğunu bilsin.
 */