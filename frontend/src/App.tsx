// frontend/src/App.tsx

import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAppDispatch } from '@/app/hooks';
import { checkAuth } from '@/features/auth/store/authThunks';
import { setAuthStatus } from '@/features/auth/store/authSlice';
import AppRoutes from '@/routes';
import { Loading } from '@/shared/components/ui/feedback';

function App() {
  const dispatch = useAppDispatch();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        console.log('🔍 Auth durumu kontrol ediliyor...');
        
        const result = await dispatch(checkAuth()).unwrap();
        
        console.log('✅ Auth geçerli, kullanıcı:', result.user);
        
        dispatch(setAuthStatus({
          user: result.user,
          isAuthenticated: true,
        }));
        
      } catch (error: any) {
        console.warn('❌ Auth geçersiz:', error);
        
        dispatch(setAuthStatus({
          user: null,
          isAuthenticated: false,
        }));
      } finally {
        // ✅ Auth kontrolü bitti, artık sayfayı göster
        setIsCheckingAuth(false);
      }
    };
    
    verifyAuth();
  }, [dispatch]);

  // ✅ Auth kontrolü devam ediyorsa loading göster
  if (isCheckingAuth) {
    return <Loading fullScreen message="Yükleniyor..." />;
  }

  return (
    <>
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

      <AppRoutes />
    </>
  );
}

export default App;