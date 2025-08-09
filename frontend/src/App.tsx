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
import PersistLogin from './features/auth/PersistLogin';
import './App.css';
import { ToastContainer } from 'react-toastify';

// YENİ SAYFALARI ve ADMIN ROUTE'u import edin
import AdminRoute from './components/AdminRoute';
import AdminDashboard from './pages/AdminDashboard';
import AddProductPage from './pages/AddProductPage';
import ManageProductsPage from './pages/ManageProductsPage';

import PaymentPage from './pages/PaymentPage'; 
import OrderDetailPage from './pages/OrderDetailPage';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow container mx-auto p-4">
          <Routes>
            <Route element={<PersistLogin />}>
              {/* Genel Rotalar */}
              <Route path="/" element={<HomePage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/product/:productId" element={<ProductDetailPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/payment/:orderId" element={<PaymentPage />} />
              <Route path="/profile/orders/:orderId" element={<OrderDetailPage />} />
              <Route path="/profile" element={<ProfilePage />} />

              {/* Admin Rotaları */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/products/add" element={<AddProductPage />} />
                <Route path="/admin/categories" element={<CategoryAdminPage />} />
                <Route path="/admin/products" element={<ManageProductsPage />} />
              </Route>
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