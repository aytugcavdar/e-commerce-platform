// frontend/src/shared/components/guards/AdminRoute.tsx

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Loading } from '@/shared/components/ui/feedback';
import AdminLayout from '@/shared/components/layout/AdminLayout';

/**
 * 🎓 ÖĞREN: Admin Route Guard
 * 
 * Bu component, sadece admin rolüne sahip kullanıcıların
 * admin paneline erişmesini sağlar.
 * 
 * Kontroller:
 * 1. Kullanıcı giriş yapmış mı? (isAuthenticated)
 * 2. Kullanıcı admin mi? (user.role === 'admin')
 * 3. Token geçerli mi? (loading durumu)
 * 
 * Akış:
 * - Loading: Token doğrulanıyor → Loading göster
 * - Not Authenticated: → /login'e yönlendir
 * - Not Admin: → Ana sayfaya yönlendir (403)
 * - Admin: → Admin panelini göster
 */

const AdminRoute = () => {
  const { user, isAuthenticated, loading, isAdmin } = useAuth();

  /**
   * 🔄 LOADING STATE
   * 
   * Auth state yükleniyorsa bekle.
   * Redux persist'ten state yüklenene kadar.
   */
  if (loading) {
    return <Loading fullScreen message="Yetkilendirme kontrol ediliyor..." />;
  }

  /**
   * 🔐 NOT AUTHENTICATED
   * 
   * Kullanıcı giriş yapmamışsa login sayfasına yönlendir.
   * from state'i ile geri dönüş için URL'i sakla.
   */
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
  }

  /**
   * 🚫 NOT ADMIN
   * 
   * Kullanıcı admin değilse ana sayfaya yönlendir.
   * Yetkisiz erişim denemesi.
   */
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  /**
   * ✅ AUTHORIZED
   * 
   * Kullanıcı admin, admin layout'u göster.
   * Outlet içinde admin sayfaları render edilir.
   */
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
};

export default AdminRoute;

/**
 * 🎯 KULLANIM ÖRNEĞİ (routes/index.tsx):
 * 
 * <Route path="/admin" element={<AdminRoute />}>
 *   <Route index element={<AdminDashboardPage />} />
 *   <Route path="products" element={<AdminProductsPage />} />
 *   <Route path="orders" element={<AdminOrdersPage />} />
 * </Route>
 * 
 * NOT: AdminLayout içinde Outlet render edilir,
 * bu sayede nested route'lar gösterilir.
 */

/**
 * 💡 PRO TIP: Loading State Önemi
 * 
 * Loading state olmadan:
 * 1. Sayfa yüklenirken user = null olabilir
 * 2. Guard hemen /login'e yönlendirir
 * 3. Redux persist state yükler
 * 4. Kullanıcı tekrar admin sayfasına gitmeye çalışır
 * 
 * Bu "flash" etkisi yaratır ve kötü UX'e neden olur.
 * 
 * Loading state ile:
 * 1. Sayfa yüklenirken Loading göster
 * 2. Redux persist state yükler
 * 3. State hazır olunca doğru yönlendirme yap
 */

/**
 * 🔥 BEST PRACTICE: Error Boundary
 * 
 * Admin panelinde hata oluşursa tüm uygulama çökmemeli.
 * ErrorBoundary ekle:
 * 
 * <ErrorBoundary fallback={<AdminErrorPage />}>
 *   <AdminLayout>
 *     <Outlet />
 *   </AdminLayout>
 * </ErrorBoundary>
 */