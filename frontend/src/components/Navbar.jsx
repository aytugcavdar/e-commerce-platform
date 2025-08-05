import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <div className="navbar bg-base-100 shadow-lg">
      <div className="flex-1">
        <Link to="/" className="btn btn-ghost text-xl">E-Commerce</Link>
      </div>
      <div className="flex-none">
        <ul className="menu menu-horizontal px-1">
          <li><Link to="/">Ana Sayfa</Link></li>
          <li><Link to="/cart">Sepet</Link></li>
          <li><Link to="/login" className="btn btn-primary">Giriş Yap</Link></li>
        </ul>
      </div>
    </div>
  );
};

export default Navbar;