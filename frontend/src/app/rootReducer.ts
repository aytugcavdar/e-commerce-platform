// frontend/src/app/rootReducer.ts

import { combineReducers } from '@reduxjs/toolkit';

// Feature reducer'ları import edeceğiz (şimdilik yorum satırı)
// import authReducer from '@/features/auth/store/authSlice';
// import productsReducer from '@/features/products/store/productsSlice';
// import cartReducer from '@/features/cart/store/cartSlice';
// import ordersReducer from '@/features/orders/store/ordersSlice';
// import userReducer from '@/features/user/store/userSlice';

/**
 * 🎓 ÖĞREN: Root Reducer Nedir?
 * 
 * Root reducer, tüm slice'ların (küçük reducer'lar) birleştirilmiş halidir.
 * 
 * Düşün ki bir apartman:
 * - Her daire = bir slice (auth, products, cart)
 * - Apartman = root reducer (hepsinin toplamı)
 * 
 * Her slice kendi state'ini yönetir, root reducer hepsini birleştirir.
 */

import authReducer from '@/features/auth/store/authSlice';
import productsReducer from '@/features/products/store/productsSlice';

const rootReducer = combineReducers({
  // 🔐 Authentication - Kullanıcı girişi, kayıt, token yönetimi
  auth: authReducer,
  
  // 🛍️ Products - Ürün listesi, detay, filtreleme
  products: productsReducer,
  
  // 🛍️ Products - Ürün listesi, detay, filtreleme
  // products: productsReducer,
  
  // 🛒 Cart - Sepet yönetimi, ürün ekleme/çıkarma
  // cart: cartReducer,
  
  // 📦 Orders - Sipariş oluşturma, listeleme, takip
  // orders: ordersReducer,
  
  // 👤 User - Profil, adres yönetimi
  // user: userReducer,
});

export default rootReducer;

/**
 * 🎯 STATE YAPISI (Reducer'lar eklendikten sonra):
 * 
 * {
 *   auth: {
 *     user: { id, email, firstName, ... },
 *     token: "eyJhbGciOiJ...",
 *     isAuthenticated: true,
 *     loading: false,
 *     error: null
 *   },
 *   products: {
 *     items: [{ id, name, price, ... }],
 *     selectedProduct: null,
 *     filters: { category: 'electronics', ... },
 *     loading: false,
 *     error: null
 *   },
 *   cart: {
 *     items: [{ productId, quantity, ... }],
 *     totalPrice: 1500,
 *     totalItems: 3
 *   },
 *   orders: {
 *     list: [],
 *     currentOrder: null,
 *     loading: false
 *   },
 *   user: {
 *     profile: { ... },
 *     addresses: [],
 *     preferences: { ... }
 *   }
 * }
 * 
 * 🔍 ERIŞIM ÖRNEĞİ:
 * 
 * const user = useAppSelector((state) => state.auth.user);
 * const cartItems = useAppSelector((state) => state.cart.items);
 * const products = useAppSelector((state) => state.products.items);
 */

/**
 * 💡 İPUCU: Neden Ayrı Slice'lar?
 * 
 * ✅ Modüler yapı - Her özellik kendi dosyasında
 * ✅ Test edilebilirlik - Her slice ayrı test edilir
 * ✅ Performans - Sadece değişen slice re-render olur
 * ✅ Okunabilirlik - 1000 satırlık tek dosya yerine 100'er satırlık 10 dosya
 * ✅ Ekip çalışması - Her geliştirici farklı slice'da çalışabilir
 */