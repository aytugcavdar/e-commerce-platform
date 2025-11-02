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
import storage from 'redux-persist/lib/storage'; // localStorage kullanır
import rootReducer from './rootReducer';

/**
 * 🎓 ÖĞREN: Redux Persist Nedir?
 * 
 * Redux Persist, state'i tarayıcı storage'ına (localStorage) kaydeder.
 * Sayfa yenilendiğinde state kaybolmaz!
 * 
 * Örnek: Kullanıcı giriş yaptı, sayfayı yeniledi, hala giriş yapılmış!
 */

// Persist yapılandırması
const persistConfig = {
  key: 'root', // localStorage'da hangi key ile saklanacak
  storage, // localStorage kullan
  whitelist: ['auth', 'cart'], // Sadece bu reducer'ları persist et
  // blacklist: ['products'], // Bu reducer'ları persist ETME
};

// Persist edilmiş reducer oluştur
const persistedReducer = persistReducer(persistConfig, rootReducer);

/**
 * 🎓 ÖĞREN: Store Yapılandırması
 * 
 * configureStore() Redux Toolkit'in ana fonksiyonu.
 * Eskiden 10+ satır kod gereken şeyleri tek satırda yapar!
 * 
 * Parametreler:
 * - reducer: Tüm reducer'larımız
 * - middleware: Özel işlemler için (API çağrıları, loglama vb.)
 * - devTools: Redux DevTools browser extension desteği
 */
export const store = configureStore({
  reducer: persistedReducer,
  
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Redux Persist action'larını ignore et
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  
  devTools: process.env.NODE_ENV !== 'production', // Sadece development'ta aktif
});

// Persistor oluştur
export const persistor = persistStore(store);

/**
 * 🎓 ÖĞREN: TypeScript Tipleri
 * 
 * Bu tipler sayesinde:
 * - useSelector'da otomatik tamamlama
 * - dispatch'te hata yakalama
 * - Type safety (tip güvenliği)
 */

// Store'un state tipini al
export type RootState = ReturnType<typeof store.getState>;

// Dispatch fonksiyonunun tipini al
export type AppDispatch = typeof store.dispatch;

/**
 * 🎯 KULLANIM ÖRNEĞİ:
 * 
 * Component içinde:
 * 
 * import { useAppSelector, useAppDispatch } from '@/app/hooks';
 * 
 * const MyComponent = () => {
 *   const dispatch = useAppDispatch();
 *   const user = useAppSelector((state) => state.auth.user);
 *   
 *   return <div>Merhaba {user?.firstName}</div>
 * }
 */