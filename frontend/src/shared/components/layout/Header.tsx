import { Link, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import Container from './Container';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  // Menü linklerini yönetmek için bir dizi
  const navLinks = [
    { to: '/', text: 'Ana Sayfa' },
    { to: '/cars', text: 'Araçlar' },
    { to: '/bookings', text: 'Rezervasyonlarım', auth: true },
    { to: '/admin/dashboard', text: 'Admin Paneli', auth: true, admin: true },
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
      .filter((link) => !link.auth || isAuthenticated)
      .filter((link) => !link.admin || user?.role === 'admin')
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
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
            <div className="bg-blue-600 text-white rounded-lg p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">Rent-a-Car</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">{renderNavLinks()}</nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <div className="relative">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span>{user?.name}</span>
                    <svg 
                      className={`w-4 h-4 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Profile Dropdown Menu */}
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
                          <div className="flex items-center space-x-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>Profilim</span>
                          </div>
                        </Link>
                        <Link
                          to="/profile/edit"
                          className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          onClick={closeProfileMenu}
                        >
                          <div className="flex items-center space-x-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Profili Düzenle</span>
                          </div>
                        </Link>
                        <hr className="my-2" />
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Çıkış Yap</span>
                          </div>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Giriş Yap
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Kayıt Ol
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            aria-label="Menüyü aç/kapat"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-4 mb-4">{renderNavLinks(true)}</nav>
            <div className="border-t pt-4">
              {isAuthenticated ? (
                <div className="flex flex-col space-y-4">
                  <Link 
                    to="/profile" 
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600" 
                    onClick={closeMobileMenu}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Profilim</span>
                  </Link>
                  <Link 
                    to="/profile/edit" 
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600" 
                    onClick={closeMobileMenu}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Profili Düzenle</span>
                  </Link>
                  <button 
                    onClick={handleLogout} 
                    className="flex items-center space-x-2 text-left text-red-600 hover:text-red-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Çıkış Yap</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col space-y-4">
                  <Link to="/login" className="text-gray-700 hover:text-blue-600" onClick={closeMobileMenu}>
                    Giriş Yap
                  </Link>
                  <Link
                    to="/register"
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                    onClick={closeMobileMenu}
                  >
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