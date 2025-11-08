// frontend/src/App.tsx

import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAppDispatch } from '@/app/hooks';
import { checkAuth } from '@/features/auth/store/authThunks';
import { setAuthStatus } from '@/features/auth/store/authSlice';
import AppRoutes from '@/routes';

/**
 * 🎓 ÖĞREN: Cookie-Based Auth ile App Başlatma
 * 
 * Sayfa yüklendiğinde:
 * 1. Redux Persist'ten kullanıcı bilgisi yüklenir (localStorage)
 * 2. Backend'e checkAuth() isteği atılır (cookie otomatik gönderilir)
 * 3. Cookie geçerliyse -> isAuthenticated: true
 * 4. Cookie geçersizse -> logout() çağrılır
 * 
 * Bu sayede sayfa yenilendiğinde kullanıcı oturumu korunur!
 */

function App() {
  const dispatch = useAppDispatch();

  /**
   * 🔍 Auth Durumunu Kontrol Et
   * 
   * Sayfa yüklendiğinde SADECE BİR KEZ çalışır.
   */
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        console.log('🔍 Auth durumu kontrol ediliyor...');
        
        // Backend'e istek at (cookie otomatik gönderilir)
        const result = await dispatch(checkAuth()).unwrap();
        
        // ✅ Başarılı: Cookie geçerli, kullanıcı bilgilerini al
        console.log('✅ Auth geçerli, kullanıcı:', result.user);
        
        dispatch(setAuthStatus({
          user: result.user,
          isAuthenticated: true,
        }));
        
      } catch (error: any) {
        // ❌ Başarısız: Cookie geçersiz veya yok
        console.warn('❌ Auth geçersiz:', error);
        
        // Kullanıcıyı çıkart
        dispatch(setAuthStatus({
          user: null,
          isAuthenticated: false,
        }));
        
        // 401 hatası varsa login sayfasına yönlendir
        if (error === 'Unauthorized') {
          console.log('🚪 Kullanıcı çıkartılıyor, login sayfasına yönlendiriliyor...');
          // ProtectedRoute zaten login'e yönlendirecek
        }
      }
    };
    
    verifyAuth();
  }, [dispatch]);

  return (
    <>
      {/* Toast Notification */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Routes */}
      <AppRoutes />
    </>
  );
}

export default App;

/**
 * 🎯 AKIŞ SENARYOLARI:
 * 
 * === SENARYO 1: İlk Giriş ===
 * 1. Kullanıcı login sayfasına gelir
 * 2. Email/şifre ile giriş yapar
 * 3. Backend Set-Cookie ile cookie'leri set eder
 * 4. Redux state'e user bilgisi kaydedilir
 * 5. Redux Persist localStorage'a yazar
 * 6. Ana sayfaya yönlendirilir
 * 
 * === SENARYO 2: Sayfa Yenileme ===
 * 1. Redux Persist localStorage'dan user bilgisini yükler
 * 2. App.tsx'te checkAuth() çağrılır
 * 3. Cookie backend'e gönderilir (otomatik)
 * 4. Backend cookie'yi doğrular, user bilgisini döndürür
 * 5. isAuthenticated: true olur
 * 6. Kullanıcı oturumu devam eder
 * 
 * === SENARYO 3: Cookie Süresi Dolmuş ===
 * 1. Redux Persist localStorage'dan user bilgisini yükler
 * 2. App.tsx'te checkAuth() çağrılır
 * 3. Backend 401 Unauthorized döner
 * 4. Response interceptor refresh token'ı dener
 * 5. Refresh token da geçersizse:
 *    - Logout endpoint'i çağrılır
 *    - Cookie'ler temizlenir
 *    - Login sayfasına yönlendirilir
 * 
 * === SENARYO 4: Manual Logout ===
 * 1. Kullanıcı çıkış butonuna basar
 * 2. Backend logout endpoint'i çağrılır
 * 3. Backend cookie'leri temizler (expires geçmiş tarih)
 * 4. Redux state temizlenir
 * 5. Redux Persist localStorage'ı temizler
 * 6. Login sayfasına yönlendirilir
 */

/**
 * 💡 PRO TIP: Loading State
 * 
 * checkAuth() çağrısı sırasında loading göstermek için:
 * 
 * const [isCheckingAuth, setIsCheckingAuth] = useState(true);
 * 
 * useEffect(() => {
 *   const verifyAuth = async () => {
 *     setIsCheckingAuth(true);
 *     try {
 *       await dispatch(checkAuth()).unwrap();
 *     } catch (error) {
 *       // Handle error
 *     } finally {
 *       setIsCheckingAuth(false);
 *     }
 *   };
 *   verifyAuth();
 * }, []);
 * 
 * if (isCheckingAuth) {
 *   return <Loading fullScreen message="Yükleniyor..." />;
 * }
 * 
 * return <AppRoutes />;
 */

/**
 * 🔥 BEST PRACTICE: Error Boundary
 * 
 * Auth kontrolü sırasında beklenmeyen hatalar için:
 * 
 * import { ErrorBoundary } from 'react-error-boundary';
 * 
 * function App() {
 *   return (
 *     <ErrorBoundary
 *       fallback={<div>Bir hata oluştu. Lütfen sayfayı yenileyin.</div>}
 *       onError={(error) => console.error('App Error:', error)}
 *     >
 *       <AppRoutes />
 *     </ErrorBoundary>
 *   );
 * }
 */