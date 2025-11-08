// frontend/src/app/store.ts

import { configureStore } from '@reduxjs/toolkit';
import { 
  persistStore, 
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // localStorage
import rootReducer from './rootReducer';

/**
 * 🎓 ÖĞREN: Cookie-Based Auth ile Redux Persist
 * 
 * Ne Persist Ediyoruz?
 * ✅ user: { id, email, firstName, ... }  (Hassas veri yok)
 * ✅ isAuthenticated: boolean             (Auth durumu)
 * ✅ cart: { items, totalPrice }          (Sepet bilgileri)
 * 
 * Ne Persist Etmiyoruz?
 * ❌ token: Backend'de cookie'de saklanıyor
 * ❌ refreshToken: Backend'de cookie'de saklanıyor
 * ❌ loading: Geçici durum, persist edilmemeli
 * ❌ error: Geçici durum, persist edilmemeli
 * 
 * 🔥 ÖNEMLİ:
 * Token'lar artık localStorage'da SAKLANMIYOR!
 * Sadece kullanıcı bilgileri persist ediliyor.
 * Token'lar HttpOnly cookie'lerde güvende!
 */

/**
 * ⚙️ Persist Yapılandırması
 */
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'cart'], // Sadece bunları persist et
  
  // 🆕 Auth state'inden sadece user ve isAuthenticated'i persist et
  // token ve refreshToken'ları ignore et (zaten yok artık!)
  transforms: [
    {
      // Transform ile auth state'ini filtrele
      in: (state: any) => {
        if (state && state.auth) {
          // Sadece gerekli alanları al
          return {
            ...state,
            auth: {
              user: state.auth.user,
              isAuthenticated: state.auth.isAuthenticated,
              // loading, error, token vb. persist edilmiyor
            },
          };
        }
        return state;
      },
      out: (state: any) => state,
    },
  ],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

/**
 * 🎯 Store Yapılandırması
 */
export const store = configureStore({
  reducer: persistedReducer,
  
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

/**
 * 🎯 KULLANIM ÖRNEĞİ (main.tsx):
 * 
 * import { StrictMode } from 'react';
 * import { createRoot } from 'react-dom/client';
 * import { Provider } from 'react-redux';
 * import { PersistGate } from 'redux-persist/integration/react';
 * import { BrowserRouter } from 'react-router-dom';
 * import { store, persistor } from './app/store';
 * import App from './App';
 * import './index.css';
 * 
 * createRoot(document.getElementById('root')!).render(
 *   <StrictMode>
 *     <Provider store={store}>
 *       <PersistGate loading={null} persistor={persistor}>
 *         <BrowserRouter>
 *           <App />
 *         </BrowserRouter>
 *       </PersistGate>
 *     </Provider>
 *   </StrictMode>
 * );
 */

/**
 * 💡 PRO TIP: Persist Transform
 * 
 * Transform, persist edilen state'i filtrelemek için kullanılır.
 * 
 * Örnek:
 * - auth state'inden sadece user ve isAuthenticated persist edilir
 * - loading, error, token gibi geçici alanlar persist edilmez
 * 
 * Neden?
 * - localStorage boyutunu azaltmak
 * - Güvenlik (token'ları persist etmemek)
 * - Performans (gereksiz veri yüklemesini önlemek)
 */

/**
 * 🔥 BEST PRACTICE: Persist vs Cookie
 * 
 * ┌───────────────────────┬────────────────┬──────────────┐
 * │                       │ localStorage   │ Cookie       │
 * ├───────────────────────┼────────────────┼──────────────┤
 * │ Kullanıcı Bilgileri   │ ✅ Redux Persist│ ❌            │
 * │ Access Token          │ ❌              │ ✅ HttpOnly   │
 * │ Refresh Token         │ ❌              │ ✅ HttpOnly   │
 * │ Sepet                 │ ✅ Redux Persist│ ❌            │
 * │ UI Tercihleri         │ ✅ Redux Persist│ ❌            │
 * └───────────────────────┴────────────────┴──────────────┘
 * 
 * 🎯 İDEAL YAPI:
 * - Hassas veriler (token): HttpOnly Cookie
 * - Kullanıcı bilgileri: Redux Persist (localStorage)
 * - Geçici durumlar: Redux State (persist edilmez)
 */