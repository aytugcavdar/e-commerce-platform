import { Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '../../../app/store'

/**
 * Sadece giriş yapmış kullanıcıların erişebileceği sayfalar için kullanılır
 * Örnek: /profile, /bookings
 */
const ProtectedRoute = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)

  if (!isAuthenticated) {
    // Giriş yapmamış kullanıcıyı login sayfasına yönlendir
    return <Navigate to="/login" replace />
  }

  // Giriş yapmış kullanıcı için sayfayı göster
  return <Outlet />
}

export default ProtectedRoute