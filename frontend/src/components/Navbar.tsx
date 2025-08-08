import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logOut, selectCurrentUser } from '../features/auth/authSlice';
import { RootState } from '../app/store';

const Navbar: React.FC = () => {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logOut());
    // İsteğe bağlı: Logout API'sine istek atılabilir.
  };

  return (
    <div className="navbar bg-base-100 shadow-lg">
      <div className="flex-1">
        <Link to="/" className="btn btn-ghost text-xl">E-Commerce</Link>
      </div>
      <div className="flex-none">
        <ul className="menu menu-horizontal px-1 items-center">
          <li><Link to="/">Ana Sayfa</Link></li>
          <li><Link to="/cart">Sepet</Link></li>
          {user ? (
            <>
              <li><Link to="/profile">Profilim</Link></li>
              <li><button onClick={handleLogout} className="btn btn-ghost">Çıkış Yap</button></li>
            </>
          ) : (
            <li><Link to="/auth" className="btn btn-primary">Giriş Yap</Link></li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Navbar;