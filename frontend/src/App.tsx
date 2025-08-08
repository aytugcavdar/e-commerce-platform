import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import AuthPage from './features/auth/AuthPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import ProfilePage from './pages/ProfilePage';
import CategoryAdminPage from './pages/CategoryAdminPage';
import PersistLogin from './features/auth/PersistLogin'; // <-- Import et
import './App.css';
import { ToastContainer } from 'react-toastify';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow container mx-auto p-4">
          <Routes>
            <Route element={<PersistLogin />}> {/* <-- Sarmalayıcı Route */}
              <Route path="/" element={<HomePage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/product/:productId" element={<ProductDetailPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/admin/categories" element={<CategoryAdminPage />} />
            </Route>
          </Routes>
        </main>
        <ToastContainer position="bottom-right" autoClose={3000} />
        <Footer />
      </div>
    </Router>
  );
}

export default App;