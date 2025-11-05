// frontend/src/shared/components/layout/Header.tsx

import { Link, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import Container from './Container';
import { env } from '@/config/env';
import ProductSearch from '@/features/products/components/ProductSearch'; // YENİ: ProductSearch import edildi

/**
 * 🎓 ÖĞREN: Header Component
 *
 * Sorumlulukları:
 * 1. Marka/Logo gösterimi (Ana sayfaya link).
 * 2. Merkezi Arama Çubuğu.
 * 3. Kimlik doğrulama durumu (Auth State) yönetimi:
 * - Giriş yapılmamışsa: "Giriş Yap" / "Kayıt Ol" butonları.
 * - Giriş yapılmışsa: Profil dropdown menüsü, "Çıkış Yap" ve "Sepet" ikonu.
 * 4. Mobil menü (responsive tasarım).
 */
const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // 🎯 useAuth hook'u ile state'i alıyoruz
  const { isAuthenticated, user, isAdmin, logout } = useAuth();

  // 🚀 Amazon tarzı, sadeleştirilmiş navigasyon linkleri
  // "Hakkımızda" ve "İletişim" footer'a taşınmalı.
  // "Siparişlerim" zaten profil dropdown'da mevcut.
  const navLinks = [
    { to: '/', text: 'Ana Sayfa' },
    { to: '/products', text: 'Ürünler' },
    // { to: '/about', text: 'Hakkımızda' }, // Footer'a taşındı
    // { to: '/contact', text: 'İletişim' }, // Footer'a taşındı
    // { to: '/orders', text: 'Siparişlerim', auth: true }, // Profil dropdown'da zaten var
    // 🔑 Sadece admin görebilir
    { to: '/admin', text: 'Admin Paneli', auth: true, admin: true },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const closeProfileMenu = () => setIsProfileMenuOpen(false);

  const handleLogout = async () => {
    closeMobileMenu();
    closeProfileMenu();
    await logout();
  };

  // Dinamik olarak render edilecek navigasyon linkleri
  const renderNavLinks = (isMobile = false) =>
    navLinks
      // Filtrele: Giriş gerektirmeyen VEYA giriş yapılmışsa
      .filter((link) => !link.auth || isAuthenticated)
      // Filtrele: Admin gerektirmeyen VEYA admin ise
      .filter((link) => !link.admin || isAdmin)
      .map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          onClick={isMobile ? closeMobileMenu : undefined}
          className={({ isActive }) =>
            `transition-colors ${
              isActive ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:text-blue-600'
            } ${isMobile ? 'block py-2' : ''}`
          }
        >
          {link.text}
        </NavLink>
      ));

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <Container>
        <div className="flex items-center justify-between h-16 gap-4 md:gap-8">
          {/* Logo (Sabit genişlik) */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0" onClick={closeMobileMenu}>
            <div className="bg-blue-600 text-white rounded-lg p-2">
              {/* 🛍️ E-Ticaret İkonu */}
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:inline">{env.appName}</span>
          </Link>

          {/* YENİ: Merkezi Arama Çubuğu (Desktop) (Esnek genişlik) */}
          <div className="hidden md:block flex-1 max-w-2xl mx-auto">
            <ProductSearch />
          </div>

          {/* Auth & Cart Buttons (Desktop) (Sabit genişlik) */}
          <div className="hidden md:flex items-center space-x-4 flex-shrink-0">
            {isAuthenticated ? (
              <>
                {/* 🛒 Sepet Butonu */}
                <Link
                  to="/cart"
                  className="p-2 text-gray-700 hover:text-blue-600 rounded-full hover:bg-gray-100 transition-colors"
                  title="Sepetim"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {/* Sepet öğe sayısı (Gelecekte eklenebilir) */}
                  {/* <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">3</span> */}
                </Link>

                {/* 👤 Profil Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-blue-600 font-semibold text-sm">
                          {user?.firstName?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="hidden lg:inline">{user?.firstName}</span>
                    <svg 
                      className={`w-4 h-4 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Profile Dropdown Menü */}
                  {isProfileMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={closeProfileMenu}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-20">
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          onClick={closeProfileMenu}
                        >
                          Profilim
                        </Link>
                        <Link
                          to="/orders"
                          className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          onClick={closeProfileMenu}
                        >
                          Siparişlerim
                        </Link>
                        <Link
                          to="/profile/edit"
                          className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          onClick={closeProfileMenu}
                        >
                          Ayarlar
                        </Link>
                        <hr className="my-2" />
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Çıkış Yap
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              // 🚪 Giriş Yap / Kayıt Ol
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors text-sm font-medium"
                >
                  Giriş Yap
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Kayıt Ol
                </Link>
              </>
            )}
          </div>

          {/* 📱 Mobile Menu Button (Arama ikonunu buraya da taşıyabiliriz) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            aria-label="Menüyü aç/kapat"
          >
            {isMobileMenuOpen ? (
              // Kapat İkonu
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              // Hamburger İkonu
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* 📱 Mobile Menu (Açılır) */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            
            {/* YENİ: Mobil Arama Çubuğu */}
            <div className="mb-4">
              <ProductSearch autoFocus />
            </div>

            <nav className="flex flex-col space-y-4 mb-4">{renderNavLinks(true)}</nav>
            <div className="border-t pt-4">
              {isAuthenticated ? (
                <div className="flex flex-col space-y-4">
                  <Link to="/profile" className="text-gray-700 hover:text-blue-600" onClick={closeMobileMenu}>
                    Profilim
                  </Link>
                  <Link to="/cart" className="text-gray-700 hover:text-blue-600" onClick={closeMobileMenu}>
                    Sepetim
                  </Link>
                  <button onClick={handleLogout} className="text-left text-red-600 hover:text-red-700">
                    Çıkış Yap
                  </button>
                </div>
              ) : (
                <div className="flex flex-col space-y-4">
                  <Link to="/login" className="text-gray-700 hover:text-blue-600" onClick={closeMobileMenu}>
                    Giriş Yap
                  </Link>
                  <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold" onClick={closeMobileMenu}>
                    Kayıt Ol
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </Container>
    </header>
  );
};

export default Header;