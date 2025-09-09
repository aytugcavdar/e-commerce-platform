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
import CategoryPage from './pages/CategoryPage';
import './App.css';
import { ToastContainer } from 'react-toastify';

// Admin route ve sayfalar
import AdminRoute from './components/AdminRoute';
import AdminDashboard from './pages/AdminDashboard';
import AddProductPage from './pages/AddProductPage';
import ManageProductsPage from './pages/ManageProductsPage';
import ManageOrdersPage from './pages/ManageOrdersPage';
import EditProductPage from './pages/EditProductPage';
import ManageUsersPage from './pages/ManageUsersPage';

// Diğer sayfalar
import PaymentPage from './pages/PaymentPage'; 
import OrderDetailPage from './pages/OrderDetailPage';

// Yeni: NotFoundPage
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Router>
      
      <ToastContainer position="bottom-right" autoClose={3000} />

      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow w-full px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route element={<PersistLogin />}>
              {/* Genel Rotalar */}
              <Route path="/" element={<HomePage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
               <Route path="/categories/:categoryId" element={<CategoryPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/payment/:orderId" element={<PaymentPage />} />
              <Route path="/profile/orders/:orderId" element={<OrderDetailPage />} />
              <Route path="/profile" element={<ProfilePage />} />

              {/* Admin Rotaları */}
              <Route element={<AdminRoute />}>
                <Route path="/admin">
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<ManageProductsPage />} />
                  <Route path="products/add" element={<AddProductPage />} />
                  <Route path="products/edit/:productId" element={<EditProductPage />} />
                  <Route path="categories" element={<CategoryAdminPage />} />
                  <Route path="orders" element={<ManageOrdersPage />} />
                  <Route path="users" element={<ManageUsersPage />} />
                </Route>
              </Route>
            </Route>

            {/* 404 Sayfası */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
