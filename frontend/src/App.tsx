// frontend/src/App.tsx

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { store, persistor } from './app/store';
import AppRoutes from './routes';
import { Loading } from './shared/components/ui/feedback';

/**
 * 🎓 ÖĞREN: App.tsx Nedir?
 * 
 * App.tsx, uygulamanın en üst seviyesidir (root component).
 * Tüm provider'lar (Redux, Router, Theme vb.) burada sarılır.
 * 
 * Provider Sırası Önemli:
 * 1. Redux Provider (En dışta)
 * 2. PersistGate (Redux Persist için)
 * 3. BrowserRouter (React Router için)
 * 4. Diğer provider'lar (Theme, Notification vb.)
 * 5. Routes (Sayfa yapısı)
 */

function App() {
  return (
    /**
     * 🔴 REDUX PROVIDER
     * 
     * Redux store'u tüm uygulamaya sağlar.
     * Herhangi bir component useSelector/useDispatch kullanabilir.
     */
    <Provider store={store}>
      {/**
       * 🟡 PERSIST GATE
       * 
       * Redux Persist ile localStorage'dan state yüklenene kadar bekler.
       * Loading component'i gösterir.
       * 
       * Neden gerekli?
       * - State yüklenmeden önce component'ler render olmasın
       * - Kullanıcı login olduysa, sayfa yenilendiğinde hala login olsun
       */}
      <PersistGate loading={<Loading fullScreen />} persistor={persistor}>
        {/**
         * 🟢 BROWSER ROUTER
         * 
         * React Router için routing context'i sağlar.
         * URL yönetimi, navigation vb.
         */}
        <BrowserRouter>
          {/**
           * 🔵 TOAST NOTIFICATION
           * 
           * react-hot-toast kütüphanesi için.
           * Başarı, hata, bilgi mesajları gösterir.
           * 
           * Kullanımı:
           * toast.success('İşlem başarılı!');
           * toast.error('Bir hata oluştu!');
           * toast.loading('Yükleniyor...');
           */}
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
          
          {/**
           * 🎯 ROUTES
           * 
           * Tüm sayfa yapısı burada.
           * Public, Protected, Admin routes vb.
           */}
          <AppRoutes />
        </BrowserRouter>
      </PersistGate>
    </Provider>
  );
}

export default App;

/**
 * 🎯 PROVIDER SIRASI NEDEN ÖNEMLİ?
 * 
 * Doğru Sıra:
 * <Provider>        ← En dışta (Redux)
 *   <PersistGate>   ← Redux state yükleme
 *     <Router>      ← Routing
 *       <Theme>     ← Tema
 *         <App />   ← Uygulama
 *       </Theme>
 *     </Router>
 *   </PersistGate>
 * </Provider>
 * 
 * Her provider, içindeki tüm component'lere context sağlar.
 * En dıştan başlayarak içe doğru sarılır.
 */

/**
 * 💡 PRO TIP: Error Boundary
 * 
 * Production'da hata yakalamak için ErrorBoundary eklenebilir:
 * 
 * <ErrorBoundary fallback={<ErrorPage />}>
 *   <AppRoutes />
 * </ErrorBoundary>
 * 
 * Böylece uygulama çökerse kullanıcı hata sayfası görür.
 */

/**
 * 🔥 BEST PRACTICE: Provider Bileşeni
 * 
 * Tüm provider'ları ayrı bir component'te toplayabilirsin:
 * 
 * // providers/AppProviders.tsx
 * const AppProviders = ({ children }) => (
 *   <Provider store={store}>
 *     <PersistGate>
 *       <BrowserRouter>
 *         <ThemeProvider>
 *           {children}
 *         </ThemeProvider>
 *       </BrowserRouter>
 *     </PersistGate>
 *   </Provider>
 * );
 * 
 * // App.tsx
 * <AppProviders>
 *   <AppRoutes />
 * </AppProviders>
 * 
 * Daha temiz ve okunabilir!
 */