// frontend/src/App.tsx

import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { store, persistor } from './app/store';
import { useAppDispatch } from './app/hooks';
import { checkTokenValidity } from './features/auth/store/authSlice';
import AppRoutes from './routes';
import { Loading } from './shared/components/ui/feedback';

/**
 * 🔐 AUTH CHECKER COMPONENT
 * 
 * Redux store içinde çalışması gereken token kontrolü.
 * Bu yüzden ayrı bir component'te.
 */
const AuthChecker = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Uygulama başlatıldığında token'ı kontrol et
    dispatch(checkTokenValidity());

    // Her 5 dakikada bir token'ı kontrol et
    const interval = setInterval(() => {
      dispatch(checkTokenValidity());
    }, 5 * 60 * 1000); // 5 dakika

    return () => clearInterval(interval);
  }, [dispatch]);

  return null;
};

/**
 * 🎯 MAIN APP COMPONENT
 */
function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={<Loading fullScreen message="Yükleniyor..." />} persistor={persistor}>
        <BrowserRouter>
          {/* Token kontrolü */}
          <AuthChecker />
          
          {/* Toast bildirimler */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
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
          
          {/* Route'lar */}
          <AppRoutes />
        </BrowserRouter>
      </PersistGate>
    </Provider>
  );
}

export default App;

/**
 * 🎯 SORUN GİDERME:
 * 
 * "Invalid token" hatası alıyorsanız:
 * 
 * 1. Konsolu kontrol edin:
 *    - "Token süresi dolmuş" mesajı varsa → Login olun
 *    - Network hatası varsa → Backend çalışıyor mu?
 * 
 * 2. Application > Local Storage:
 *    - auth_token var mı?
 *    - Değeri geçerli mi? (jwt.io'da test edin)
 * 
 * 3. Redux DevTools:
 *    - auth.isAuthenticated: true mi?
 *    - auth.user: var mı?
 *    - auth.token: var mı?
 * 
 * 4. Backend logs:
 *    - Token doğrulama hatası var mı?
 *    - JWT_SECRET doğru mu?
 */

/**
 * 💡 PRO TIP: Token Refresh
 * 
 * Token süresi dolmadan önce yenileyin:
 * 
 * useEffect(() => {
 *   const token = localStorage.getItem('auth_token');
 *   if (!token) return;
 *   
 *   try {
 *     const payload = JSON.parse(atob(token.split('.')[1]));
 *     const expiresIn = (payload.exp * 1000) - Date.now();
 *     
 *     // 5 dakika kalınca yenile
 *     if (expiresIn < 5 * 60 * 1000 && expiresIn > 0) {
 *       dispatch(refreshToken());
 *     }
 *   } catch (error) {
 *     console.error('Token decode hatası:', error);
 *   }
 * }, [dispatch]);
 */

/**
 * 🔥 DEBUG MODE
 * 
 * Geliştirme sırasında token bilgilerini konsola yazdır:
 */
if (import.meta.env.DEV) {
  window.addEventListener('load', () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('🔐 Token Bilgileri:', {
          userId: payload.userId,
          role: payload.role,
          expiresAt: new Date(payload.exp * 1000).toLocaleString('tr-TR'),
          isExpired: payload.exp < Math.floor(Date.now() / 1000),
        });
      } catch (error) {
        console.error('❌ Token decode hatası:', error);
      }
    } else {
      console.log('❌ Token bulunamadı');
    }
  });
}