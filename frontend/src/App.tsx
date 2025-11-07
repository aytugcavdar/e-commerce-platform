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
import { env } from './config/env';
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


