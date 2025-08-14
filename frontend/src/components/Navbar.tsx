import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logOut, selectCurrentUser } from '../features/auth/authSlice';

const Navbar: React.FC = () => {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logOut());
    setIsMobileMenuOpen(false);
  };

  const handleMobileMenuClick = () => {
    setIsMobileMenuOpen(false);
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  const NavLink: React.FC<{ to: string; children: React.ReactNode; icon?: string; onClick?: () => void }> = ({ 
    to, 
    children, 
    icon, 
    onClick 
  }) => (
    <Link 
      to={to} 
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
        hover:bg-base-200 hover:shadow-md hover:scale-105 active:scale-95
        ${isActiveRoute(to) ? 'bg-primary/10 text-primary border border-primary/20' : 'text-base-content'}
      `}
    >
      {icon && <span className="text-lg">{icon}</span>}
      {children}
    </Link>
  );

  return (
    <>
      <div className="navbar bg-base-100 shadow-lg sticky top-0 z-50 backdrop-blur-md bg-base-100/95">
        <div className="navbar-start">
          {/* Mobile menu button */}
          <div className="dropdown lg:hidden">
            <div 
              tabIndex={0} 
              role="button" 
              className="btn btn-ghost btn-circle hover:bg-base-200 hover:rotate-90 transition-all duration-300"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </div>
          </div>
          
          {/* Logo */}
          <Link 
            to="/" 
            className="btn btn-ghost text-xl font-bold hover:scale-105 transition-transform duration-200 group"
          >
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent group-hover:from-secondary group-hover:to-primary transition-all duration-300">
              🛍️ E-Commerce
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 gap-2">
            <li>
              <NavLink to="/" icon="🏠">
                Ana Sayfa
              </NavLink>
            </li>
            <li>
              <NavLink to="/cart" icon="🛒">
                Sepet
              </NavLink>
            </li>
          </ul>
        </div>

        {/* Right side - User menu */}
        <div className="navbar-end">
          {user ? (
            <div className="flex items-center gap-2">
              {/* Admin Panel Link - Desktop */}
              {user.role === 'admin' && (
                <NavLink to="/admin" icon="⚙️">
                  <span className="hidden lg:inline">Yönetim</span>
                </NavLink>
              )}
              
              {/* User Menu Dropdown */}
              <div className="dropdown dropdown-end">
                <div 
                  tabIndex={0} 
                  role="button" 
                  className="btn btn-ghost btn-circle avatar hover:ring-2 hover:ring-primary/50 transition-all duration-200"
                >
                  <div className="w-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-primary-content font-bold">
                    {user.firstName ? user.firstName.charAt(0).toUpperCase() : '👤'}
                  </div>
                </div>
                <ul 
                  tabIndex={0} 
                  className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-xl bg-base-100 rounded-box w-52 border border-base-300"
                >
                  <li className="menu-title">
                    <span className="text-xs text-base-content/60">
                      Hoş geldin, {user.firstName || user.username}!
                    </span>
                  </li>
                  <li>
                    <Link to="/profile" className="flex items-center gap-2 hover:bg-primary/10">
                      👤 Profilim
                    </Link>
                  </li>
                  {user.role === 'admin' && (
                    <li className="lg:hidden">
                      <Link to="/admin" className="flex items-center gap-2 hover:bg-primary/10">
                        ⚙️ Yönetim Paneli
                      </Link>
                    </li>
                  )}
                  <div className="divider my-1"></div>
                  <li>
                    <button 
                      onClick={handleLogout} 
                      className="flex items-center gap-2 text-error hover:bg-error/10"
                    >
                      🚪 Çıkış Yap
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <Link 
              to="/auth" 
              className="btn btn-primary hover:btn-primary hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              <span className="hidden sm:inline">🔐</span>
              Giriş Yap
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className="fixed left-0 top-[4rem] w-80 h-full bg-base-100 shadow-xl transform transition-transform duration-300 ease-in-out"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              <div className="text-lg font-bold text-base-content/60 border-b border-base-300 pb-2">
                Navigasyon
              </div>
              
              <div className="space-y-2">
                <NavLink to="/" icon="🏠" onClick={handleMobileMenuClick}>
                  Ana Sayfa
                </NavLink>
                <NavLink to="/cart" icon="🛒" onClick={handleMobileMenuClick}>
                  Sepet
                </NavLink>
                
                {user && (
                  <>
                    <div className="divider"></div>
                    <NavLink to="/profile" icon="👤" onClick={handleMobileMenuClick}>
                      Profilim
                    </NavLink>
                    {user.role === 'admin' && (
                      <NavLink to="/admin" icon="⚙️" onClick={handleMobileMenuClick}>
                        Yönetim Paneli
                      </NavLink>
                    )}
                    <div className="divider"></div>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 text-error hover:bg-error/10 w-full text-left"
                    >
                      🚪 Çıkış Yap
                    </button>
                  </>
                )}
                
                {!user && (
                  <>
                    <div className="divider"></div>
                    <NavLink to="/auth" icon="🔐" onClick={handleMobileMenuClick}>
                      Giriş Yap
                    </NavLink>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;