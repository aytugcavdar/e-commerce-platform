// frontend/src/routes/index.tsx

import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Layouts
import AppLayout from '@/shared/components/layout/AppLayout';

// Guards
import ProtectedRoute from '@/shared/components/guards/ProtectedRoute';
import GuestRoute from '@/shared/components/guards/GuestRoute';
import AdminRoute from '@/shared/components/guards/AdminRoute';

// Loading
import { Loading } from '@/shared/components/ui/feedback';

/**
 * 🎓 ÖĞREN: Lazy Loading Nedir?
 * 
 * Lazy loading, component'leri sadece gerektiğinde yükler.
 * 
 * ❌ Normal Import:
 * import HomePage from './pages/HomePage';
 * // Tüm sayfa ilk yüklemede gelir (Bundle size büyür)
 * 
 * ✅ Lazy Import:
 * const HomePage = lazy(() => import('./pages/HomePage'));
 * // Sayfa sadece ziyaret edildiğinde yüklenir
 * 
 * Avantajları:
 * - İlk yükleme hızlı
 * - Bundle size küçük
 * - Kullanıcı deneyimi iyi
 * 
 * Suspense ile birlikte kullanılır (loading göstermek için).
 */

// ============================================
// PUBLIC PAGES (Herkes Erişebilir)
// ============================================
const HomePage = lazy(() => import('@/pages/HomePage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// ============================================
// AUTH PAGES (Sadece Giriş Yapmamışlar)
// ============================================
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('@/features/auth/pages/VerifyEmailPage'));

// ============================================
// PROTECTED PAGES (Sadece Giriş Yapmışlar)
// ============================================
const ProfilePage = lazy(() => import('@/features/user/pages/ProfilePage'));
const ProfileEditPage = lazy(() => import('@/features/user/pages/ProfileEditPage'));
const OrdersPage = lazy(() => import('@/features/orders/pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('@/features/orders/pages/OrderDetailPage'));
const CheckoutPage = lazy(() => import('@/features/orders/pages/CheckoutPage'));

// ============================================
// PRODUCT PAGES (Herkes Erişebilir)
// ============================================
const ProductsPage = lazy(() => import('@/features/products/pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('@/features/products/pages/ProductDetailPage'));
const CartPage = lazy(() => import('@/features/cart/pages/CartPage'));

// ============================================
// ADMIN PAGES (Sadece Admin)
// ============================================
const AdminDashboardPage = lazy(() => import('@/features/admin/pages/DashboardPage'));
const AdminProductsPage = lazy(() => import('@/features/admin/pages/ProductsManagementPage'));
const AdminOrdersPage = lazy(() => import('@/features/admin/pages/OrdersManagementPage'));
const AdminUsersPage = lazy(() => import('@/features/admin/pages/UsersManagementPage'));

/**
 * 🎯 APP ROUTES - Ana Route Yapısı
 */
const AppRoutes = () => {
  return (
    <Suspense fallback={<Loading fullScreen message="Sayfa yükleniyor..." />}>
      <Routes>
        {/**
         * 🌐 PUBLIC ROUTES (Layout ile)
         * 
         * AppLayout: Header + Content + Footer
         */}
        <Route element={<AppLayout />}>
          {/* Ana Sayfa */}
          <Route path="/" element={<HomePage />} />
          
          {/* Hakkımızda */}
          <Route path="/about" element={<AboutPage />} />
          
          {/* İletişim */}
          <Route path="/contact" element={<ContactPage />} />
          
          {/* Ürünler */}
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          
          {/* Sepet */}
          <Route path="/cart" element={<CartPage />} />
        </Route>
        
        {/**
         * 🔐 AUTH ROUTES (Layout olmadan, sadece form)
         * 
         * GuestRoute: Sadece giriş yapmamışlar erişebilir
         * Giriş yapmışsa ana sayfaya yönlendir
         */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Route>
        
        {/**
         * 🔒 PROTECTED ROUTES (Layout ile, login gerekli)
         * 
         * ProtectedRoute: Sadece giriş yapmışlar erişebilir
         * Giriş yapmamışsa login sayfasına yönlendir
         */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {/* Profil */}
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/edit" element={<ProfileEditPage />} />
            
            {/* Siparişler */}
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            
            {/* Ödeme */}
            <Route path="/checkout" element={<CheckoutPage />} />
          </Route>
        </Route>
        
        {/**
         * 👨‍💼 ADMIN ROUTES (Admin Layout, sadece admin)
         * 
         * AdminRoute: Sadece admin rolü erişebilir
         * Admin değilse ana sayfaya yönlendir
         */}
        <Route path="/admin" element={<AdminRoute />}>
          {/* Admin Dashboard */}
          <Route index element={<AdminDashboardPage />} />
          
          {/* Ürün Yönetimi */}
          <Route path="products" element={<AdminProductsPage />} />
          
          {/* Sipariş Yönetimi */}
          <Route path="orders" element={<AdminOrdersPage />} />
          
          {/* Kullanıcı Yönetimi */}
          <Route path="users" element={<AdminUsersPage />} />
        </Route>
        
        {/**
         * ❌ 404 - Sayfa Bulunamadı
         */}
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;

/**
 * 🎯 ROUTE YAPISI ÖZET:
 * 
 * /                          → Ana sayfa (Public)
 * /about                     → Hakkımızda (Public)
 * /products                  → Ürünler (Public)
 * /products/:slug            → Ürün detay (Public)
 * /cart                      → Sepet (Public)
 * 
 * /login                     → Giriş (Guest only)
 * /register                  → Kayıt (Guest only)
 * /forgot-password           → Şifremi unuttum (Guest only)
 * 
 * /profile                   → Profil (Protected)
 * /orders                    → Siparişlerim (Protected)
 * /checkout                  → Ödeme (Protected)
 * 
 * /admin                     → Admin panel (Admin only)
 * /admin/products            → Ürün yönetimi (Admin only)
 * /admin/orders              → Sipariş yönetimi (Admin only)
 * 
 * /404                       → Sayfa bulunamadı
 */

/**
 * 💡 PRO TIP: Route Parametreleri
 * 
 * /products/:slug → :slug dinamik parametre
 * 
 * Component içinde:
 * import { useParams } from 'react-router-dom';
 * 
 * const ProductDetailPage = () => {
 *   const { slug } = useParams();
 *   // URL: /products/iphone-15-pro → slug = "iphone-15-pro"
 * };
 */

/**
 * 🔥 BEST PRACTICE: Nested Routes
 * 
 * Ortak layout paylaşan rotalar gruplanabilir:
 * 
 * <Route element={<AppLayout />}>
 *   <Route path="/" element={<HomePage />} />
 *   <Route path="/about" element={<AboutPage />} />
 * </Route>
 * 
 * Her ikisi de aynı layout'u kullanır (Header + Footer).
 */