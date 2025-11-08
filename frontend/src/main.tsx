// frontend/src/main.tsx

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux'; // ✅ Redux Provider
import { PersistGate } from 'redux-persist/integration/react'; // ✅ Redux Persist
import { BrowserRouter } from 'react-router-dom';
import { store, persistor } from './app/store'; // ✅ Store ve Persistor
import App from './App';
import './index.css';

/**
 * 🎓 ÖĞREN: Provider Yapısı
 * 
 * Doğru sıralama:
 * 1. StrictMode (React dev mode kontrolleri)
 * 2. Provider (Redux store'u sağla)
 * 3. PersistGate (Persist yüklenene kadar bekle)
 * 4. BrowserRouter (Routing)
 * 5. App (Ana component)
 * 
 * ❌ YANLIŞ:
 * <BrowserRouter>
 *   <Provider>  ❌ Hata! Provider en dışta olmalı
 *     <App />
 *   </Provider>
 * </BrowserRouter>
 * 
 * ✅ DOĞRU:
 * <Provider>
 *   <PersistGate>
 *     <BrowserRouter>
 *       <App />
 *     </BrowserRouter>
 *   </PersistGate>
 * </Provider>
 */

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* 1️⃣ Redux Provider - Store'u tüm uygulamaya sağlar */}
    <Provider store={store}>
      {/* 2️⃣ PersistGate - localStorage'dan state yüklenene kadar bekler */}
      <PersistGate loading={null} persistor={persistor}>
        {/* 3️⃣ BrowserRouter - Routing için */}
        <BrowserRouter>
          {/* 4️⃣ Ana Component */}
          <App />
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </StrictMode>
);

/**
 * 💡 PRO TIP: Loading State
 * 
 * PersistGate'in loading prop'una bir component verebilirsin:
 * 
 * <PersistGate 
 *   loading={<div>Yükleniyor...</div>} 
 *   persistor={persistor}
 * >
 *   <App />
 * </PersistGate>
 * 
 * Bu sayede persist yüklenirken kullanıcıya loading gösterilir.
 */

/**
 * 🔥 BEST PRACTICE: Error Boundary
 * 
 * Provider dışında bir hata yakalayıcı ekle:
 * 
 * import { ErrorBoundary } from 'react-error-boundary';
 * 
 * <StrictMode>
 *   <ErrorBoundary fallback={<div>Bir hata oluştu</div>}>
 *     <Provider store={store}>
 *       <PersistGate persistor={persistor}>
 *         <BrowserRouter>
 *           <App />
 *         </BrowserRouter>
 *       </PersistGate>
 *     </Provider>
 *   </ErrorBoundary>
 * </StrictMode>
 */