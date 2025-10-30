import { Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '../../../app/store'

/**
 * Sadece giriş yapmamış kullanıcıların erişebileceği sayfalar için kullanılır
 * Örnek: /login, /register
 * Giriş yapmış kullanıcı bu sayfalara erişmeye çalışırsa ana sayfaya yönlendirilir
 */
const GuestRoute = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)

  if (isAuthenticated) {
    // Giriş yapmış kullanıcıyı ana sayfaya yönlendir
    return <Navigate to="/" replace />
  }

  // Giriş yapmamış kullanıcı için sayfayı göster
  return <Outlet />
}

export default GuestRoute