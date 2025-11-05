// frontend/src/features/cart/store/cartSlice.ts

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CartState, CartItem, CartSummary, CouponCode } from '../types/cart.types';
import type { Product } from '@/features/products/types/product.types';

/**
 * 🎓 ÖĞREN: Cart Slice Nedir?
 * 
 * Sepet state'ini yöneten Redux slice.
 * 
 * Sorumlulukları:
 * 1. Sepete ürün ekleme (addToCart)
 * 2. Sepetten ürün çıkarma (removeFromCart)
 * 3. Ürün adedini güncelleme (updateQuantity)
 * 4. Sepeti temizleme (clearCart)
 * 5. Kupon kodu uygulama (applyCoupon)
 * 6. Toplam fiyat hesaplama (calculateSummary)
 */

/**
 * 🏁 INITIAL STATE
 */
const initialState: CartState = {
  items: [],
  coupon: null,
  summary: {
    subtotal: 0,
    shipping: 0,
    tax: 0,
    discount: 0,
    total: 0,
  },
  loading: false,
  validatingCoupon: false,
  error: null,
};

/**
 * 🎯 CART SLICE
 */
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    /**
     * 🛒 ADD TO CART - Sepete Ekle
     * 
     * Aynı ürün varsa quantity artır, yoksa yeni ürün ekle.
     */
    addToCart: (state, action: PayloadAction<{ product: Product; quantity?: number }>) => {
      const { product, quantity = 1 } = action.payload;
      
      // Sepette aynı ürün var mı?
      const existingItem = state.items.find(item => item.productId === product._id);
      
      if (existingItem) {
        // Varsa adet artır (stok kontrolü yap)
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity <= product.stock) {
          existingItem.quantity = newQuantity;
        } else {
          state.error = `Stokta sadece ${product.stock} adet var!`;
          return;
        }
      } else {
        // Yoksa yeni ürün ekle
        if (quantity > product.stock) {
          state.error = `Stokta sadece ${product.stock} adet var!`;
          return;
        }
        
        const cartItem: CartItem = {
          productId: product._id,
          name: product.name,
          slug: product.slug,
          image: product.images?.[0]?.url || '',
          price: product.price,
          discountPrice: product.discountPrice,
          stock: product.stock,
          quantity,
          addedAt: new Date().toISOString(),
        };
        
        state.items.push(cartItem);
      }
      
      // Özeti yeniden hesapla
      calculateSummary(state);
      state.error = null;
    },
    
    /**
     * 🗑️ REMOVE FROM CART - Sepetten Çıkar
     */
    removeFromCart: (state, action: PayloadAction<string>) => {
      const productId = action.payload;
      state.items = state.items.filter(item => item.productId !== productId);
      calculateSummary(state);
    },
    
    /**
     * 🔄 UPDATE QUANTITY - Adet Güncelle
     */
    updateQuantity: (state, action: PayloadAction<{ productId: string; quantity: number }>) => {
      const { productId, quantity } = action.payload;
      const item = state.items.find(item => item.productId === productId);
      
      if (item) {
        // Adet kontrolü
        if (quantity <= 0) {
          // 0 veya negatifse sepetten çıkar
          state.items = state.items.filter(item => item.productId !== productId);
        } else if (quantity > item.stock) {
          // Stoktan fazlaysa hata
          state.error = `Stokta sadece ${item.stock} adet var!`;
          return;
        } else {
          // Güncelle
          item.quantity = quantity;
        }
        
        calculateSummary(state);
        state.error = null;
      }
    },
    
    /**
     * ➕ INCREMENT - Adet Artır (+1)
     */
    incrementQuantity: (state, action: PayloadAction<string>) => {
      const productId = action.payload;
      const item = state.items.find(item => item.productId === productId);
      
      if (item) {
        if (item.quantity < item.stock) {
          item.quantity += 1;
          calculateSummary(state);
          state.error = null;
        } else {
          state.error = `Stokta sadece ${item.stock} adet var!`;
        }
      }
    },
    
    /**
     * ➖ DECREMENT - Adet Azalt (-1)
     */
    decrementQuantity: (state, action: PayloadAction<string>) => {
      const productId = action.payload;
      const item = state.items.find(item => item.productId === productId);
      
      if (item) {
        if (item.quantity > 1) {
          item.quantity -= 1;
          calculateSummary(state);
        } else {
          // Adet 1'den azsa sepetten çıkar
          state.items = state.items.filter(item => item.productId !== productId);
          calculateSummary(state);
        }
        state.error = null;
      }
    },
    
    /**
     * 🗑️ CLEAR CART - Sepeti Temizle
     */
    clearCart: (state) => {
      state.items = [];
      state.coupon = null;
      state.error = null;
      calculateSummary(state);
    },
    
    /**
     * 🎟️ APPLY COUPON - Kupon Kodu Uygula
     */
    applyCoupon: (state, action: PayloadAction<CouponCode>) => {
      state.coupon = action.payload;
      calculateSummary(state);
    },
    
    /**
     * 🎟️ REMOVE COUPON - Kupon Kodunu Kaldır
     */
    removeCoupon: (state) => {
      state.coupon = null;
      calculateSummary(state);
    },
    
    /**
     * ❌ CLEAR ERROR - Hata Temizle
     */
    clearError: (state) => {
      state.error = null;
    },
    
    /**
     * 🔄 UPDATE STOCK - Stok Güncelle (Checkout sonrası)
     * 
     * Backend'den güncel stok bilgisi geldiğinde sepeti güncelle
     */
    updateStock: (state, action: PayloadAction<{ productId: string; stock: number }[]>) => {
      action.payload.forEach(({ productId, stock }) => {
        const item = state.items.find(item => item.productId === productId);
        if (item) {
          item.stock = stock;
          // Stoktan fazlaysa adedi düşür
          if (item.quantity > stock) {
            item.quantity = stock;
          }
        }
      });
      calculateSummary(state);
    },
  },
});

/**
 * 💰 HELPER: Sepet Özetini Hesapla
 */
function calculateSummary(state: CartState) {
  // Ara toplam (subtotal)
  const subtotal = state.items.reduce((total, item) => {
    const price = item.discountPrice || item.price;
    return total + (price * item.quantity);
  }, 0);
  
  // Kargo ücreti (200 TL üzeri ücretsiz)
  const shipping = subtotal >= 200 ? 0 : 29.90;
  
  // Vergi (KDV %20)
  const tax = subtotal * 0.20;
  
  // İndirim (kupon kodu varsa)
  let discount = 0;
  if (state.coupon && state.coupon.isValid) {
    if (state.coupon.type === 'percentage') {
      discount = subtotal * (state.coupon.value / 100);
    } else {
      discount = state.coupon.value;
    }
  }
  
  // Toplam
  const total = subtotal + shipping + tax - discount;
  
  state.summary = {
    subtotal,
    shipping,
    tax,
    discount,
    total: Math.max(0, total), // Negatif olmasın
  };
}

/**
 * 📤 EXPORT ACTIONS
 */
export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  incrementQuantity,
  decrementQuantity,
  clearCart,
  applyCoupon,
  removeCoupon,
  clearError,
  updateStock,
} = cartSlice.actions;

/**
 * 📤 EXPORT REDUCER
 */
export default cartSlice.reducer;

/**
 * 🎯 KULLANIM ÖRNEKLERİ:
 * 
 * // Sepete ekle
 * dispatch(addToCart({ product, quantity: 2 }));
 * 
 * // Sepetten çıkar
 * dispatch(removeFromCart(productId));
 * 
 * // Adet güncelle
 * dispatch(updateQuantity({ productId, quantity: 5 }));
 * 
 * // Adet artır/azalt
 * dispatch(incrementQuantity(productId));
 * dispatch(decrementQuantity(productId));
 * 
 * // Sepeti temizle
 * dispatch(clearCart());
 * 
 * // Kupon uygula
 * dispatch(applyCoupon({
 *   code: 'INDIRIM20',
 *   type: 'percentage',
 *   value: 20,
 *   isValid: true
 * }));
 */