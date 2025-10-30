import { Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '../../../app/store'

/**
 * Sadece admin kullanıcıların erişebileceği sayfalar için kullanılır
 * Örnek: /admin/dashboard, /admin/cars
 */
const AdminRoute = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)

  if (!isAuthenticated) {
    // Giriş yapmamış kullanıcıyı login sayfasına yönlendir
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'admin') {
    // Admin yetkisi olmayan kullanıcıyı ana sayfaya yönlendir
    return <Navigate to="/" replace />
  }

  // Admin kullanıcı için sayfayı göster
  return <Outlet />
}

export default AdminRoute