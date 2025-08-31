// Navbar.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logOut, selectCurrentUser } from '../features/auth/authSlice';
import SearchBar from './SearchBar';

const Navbar: React.FC = () => {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logOut());
    setIsMobileMenuOpen(false);
  };

  const isActiveRoute = (path: string) => location.pathname === path;

  return (
    <div className="navbar bg-base-100 shadow sticky top-0 z-50 backdrop-blur">
      <div className="navbar-start">
        {/* Mobile menu button */}
        <div className="dropdown lg:hidden">
          <label tabIndex={0} className="btn btn-ghost btn-circle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </label>
          {isMobileMenuOpen && (
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
              <li>
                <Link to="/" className={isActiveRoute('/') ? 'active' : ''}>🏠 Ana Sayfa</Link>
              </li>
              <li>
                <Link to="/cart" className={isActiveRoute('/cart') ? 'active' : ''}>🛒 Sepet</Link>
              </li>
              {user ? (
                <>
                  <li><Link to="/profile">👤 Profilim</Link></li>
                  {user.role === 'admin' && <li><Link to="/admin">⚙️ Yönetim</Link></li>}
                  <li><button onClick={handleLogout} className="text-error">🚪 Çıkış</button></li>
                </>
              ) : (
                <li><Link to="/auth">🔐 Giriş Yap</Link></li>
              )}
            </ul>
          )}
        </div>

        {/* Logo */}
        <Link to="/" className="btn btn-ghost normal-case text-xl">🛍️ E-Commerce</Link>
      </div>

      {/* Desktop center nav */}
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li><Link to="/" className={isActiveRoute('/') ? 'active' : ''}>🏠 Ana Sayfa</Link></li>
          <li><Link to="/cart" className={isActiveRoute('/cart') ? 'active' : ''}>🛒 Sepet</Link></li>
        </ul>
      </div>

      {/* SearchBar center */}
      <div className="navbar-center hidden lg:flex">
        <SearchBar />
      </div>

      {/* Right side */}
      <div className="navbar-end">
        {user ? (
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-primary-content font-bold">
                {user.firstName ? user.firstName.charAt(0).toUpperCase() : '👤'}
              </div>
            </label>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
              <li className="menu-title">Hoş geldin, {user.firstName || user.username}!</li>
              <li><Link to="/profile">👤 Profilim</Link></li>
              {user.role === 'admin' && <li><Link to="/admin">⚙️ Yönetim</Link></li>}
              <li><button onClick={handleLogout} className="text-error">🚪 Çıkış Yap</button></li>
            </ul>
          </div>
        ) : (
          <Link to="/auth" className="btn btn-primary">🔐 Giriş Yap</Link>
        )}
      </div>
    </div>
  );
};

export default Navbar;
