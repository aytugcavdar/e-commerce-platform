// frontend/src/features/cart/hooks/useCart.ts

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  addToCart,
  removeFromCart,
  updateQuantity,
  incrementQuantity,
  decrementQuantity,
  clearCart,
  applyCoupon,
  removeCoupon,
  clearError,
} from '../store/cartSlice';
import type { Product } from '@/features/products/types/product.types';
import type { CouponCode } from '../types/cart.types';

/**
 * 🎓 ÖĞREN: useCart Hook
 * 
 * Sepet işlemlerini kolaylaştıran custom hook.
 * Component'lerde direkt kullanılabilir.
 * 
 * Sorumlulukları:
 * - Sepete ekleme/çıkarma
 * - Adet güncelleme
 * - Kupon kodu yönetimi
 * - Sepet özeti hesaplama
 * - Computed values (totalItems, isEmpty vb.)
 */

interface UseCartReturn {
  // State
  items: ReturnType<typeof useAppSelector>['cart']['items'];
  summary: ReturnType<typeof useAppSelector>['cart']['summary'];
  coupon: ReturnType<typeof useAppSelector>['cart']['coupon'];
  loading: boolean;
  error: string | null;
  
  // Computed Values
  totalItems: number;
  isEmpty: boolean;
  hasItems: boolean;
  
  // Functions
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
  incrementItem: (productId: string) => void;
  decrementItem: (productId: string) => void;
  clear: () => void;
  applyCouponCode: (coupon: CouponCode) => void;
  removeCouponCode: () => void;
  clearCartError: () => void;
  
  // Helpers
  isInCart: (productId: string) => boolean;
  getItemQuantity: (productId: string) => number;
}

/**
 * 🎯 USE CART HOOK
 */
export const useCart = (): UseCartReturn => {
  const dispatch = useAppDispatch();
  
  // Redux state'inden cart verilerini al
  const { items, summary, coupon, loading, error } = useAppSelector(
    (state) => state.cart
  );
  
  /**
   * 🛒 ADD ITEM - Sepete Ekle
   */
  const addItem = useCallback(
    (product: Product, quantity = 1) => {
      dispatch(addToCart({ product, quantity }));
    },
    [dispatch]
  );
  
  /**
   * 🗑️ REMOVE ITEM - Sepetten Çıkar
   */
  const removeItem = useCallback(
    (productId: string) => {
      dispatch(removeFromCart(productId));
    },
    [dispatch]
  );
  
  /**
   * 🔄 UPDATE ITEM QUANTITY - Adet Güncelle
   */
  const updateItemQuantity = useCallback(
    (productId: string, quantity: number) => {
      dispatch(updateQuantity({ productId, quantity }));
    },
    [dispatch]
  );
  
  /**
   * ➕ INCREMENT ITEM - Adet Artır
   */
  const incrementItem = useCallback(
    (productId: string) => {
      dispatch(incrementQuantity(productId));
    },
    [dispatch]
  );
  
  /**
   * ➖ DECREMENT ITEM - Adet Azalt
   */
  const decrementItem = useCallback(
    (productId: string) => {
      dispatch(decrementQuantity(productId));
    },
    [dispatch]
  );
  
  /**
   * 🗑️ CLEAR - Sepeti Temizle
   */
  const clear = useCallback(() => {
    dispatch(clearCart());
  }, [dispatch]);
  
  /**
   * 🎟️ APPLY COUPON CODE - Kupon Kodu Uygula
   */
  const applyCouponCode = useCallback(
    (couponData: CouponCode) => {
      dispatch(applyCoupon(couponData));
    },
    [dispatch]
  );
  
  /**
   * 🎟️ REMOVE COUPON CODE - Kupon Kodunu Kaldır
   */
  const removeCouponCode = useCallback(() => {
    dispatch(removeCoupon());
  }, [dispatch]);
  
  /**
   * ❌ CLEAR ERROR - Hata Temizle
   */
  const clearCartError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);
  
  /**
   * 📊 COMPUTED VALUES
   */
  
  // Toplam ürün adedi
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  
  // Sepet boş mu?
  const isEmpty = items.length === 0;
  
  // Sepette ürün var mı?
  const hasItems = items.length > 0;
  
  /**
   * 🔍 HELPER: Ürün Sepette Mi?
   */
  const isInCart = useCallback(
    (productId: string): boolean => {
      return items.some(item => item.productId === productId);
    },
    [items]
  );
  
  /**
   * 🔢 HELPER: Ürün Adedi Nedir?
   */
  const getItemQuantity = useCallback(
    (productId: string): number => {
      const item = items.find(item => item.productId === productId);
      return item?.quantity || 0;
    },
    [items]
  );
  
  return {
    // State
    items,
    summary,
    coupon,
    loading,
    error,
    
    // Computed Values
    totalItems,
    isEmpty,
    hasItems,
    
    // Functions
    addItem,
    removeItem,
    updateItemQuantity,
    incrementItem,
    decrementItem,
    clear,
    applyCouponCode,
    removeCouponCode,
    clearCartError,
    
    // Helpers
    isInCart,
    getItemQuantity,
  };
};

/**
 * 🎯 KULLANIM ÖRNEKLERİ:
 * 
 * // 1. Component'te Basit Kullanım
 * const ProductCard = ({ product }) => {
 *   const { addItem, isInCart } = useCart();
 *   
 *   return (
 *     <div>
 *       <h3>{product.name}</h3>
 *       {isInCart(product._id) ? (
 *         <span>✓ Sepette</span>
 *       ) : (
 *         <button onClick={() => addItem(product)}>
 *           Sepete Ekle
 *         </button>
 *       )}
 *     </div>
 *   );
 * };
 * 
 * // 2. Header'da Sepet Sayısı
 * const Header = () => {
 *   const { totalItems } = useCart();
 *   
 *   return (
 *     <Link to="/cart">
 *       🛒 Sepet ({totalItems})
 *     </Link>
 *   );
 * };
 * 
 * // 3. CartPage'de
 * const CartPage = () => {
 *   const {
 *     items,
 *     summary,
 *     isEmpty,
 *     removeItem,
 *     incrementItem,
 *     decrementItem,
 *   } = useCart();
 *   
 *   if (isEmpty) {
 *     return <EmptyCart />;
 *   }
 *   
 *   return (
 *     <div>
 *       {items.map(item => (
 *         <CartItem
 *           key={item.productId}
 *           item={item}
 *           onRemove={removeItem}
 *           onIncrement={incrementItem}
 *           onDecrement={decrementItem}
 *         />
 *       ))}
 *       <CartSummary summary={summary} />
 *     </div>
 *   );
 * };
 * 
 * // 4. Kupon Kodu Uygulama
 * const CouponInput = () => {
 *   const { applyCouponCode } = useCart();
 *   const [code, setCode] = useState('');
 *   
 *   const handleApply = async () => {
 *     // Backend'den kupon doğrula
 *     const response = await apiClient.post('/cart/validate-coupon', { code });
 *     
 *     if (response.data.success) {
 *       applyCouponCode(response.data.data);
 *       toast.success('Kupon uygulandı!');
 *     }
 *   };
 *   
 *   return <input onChange={(e) => setCode(e.target.value)} />;
 * };
 */

/**
 * 💡 PRO TIP: Toast Notifications
 * 
 * import { toast } from 'react-hot-toast';
 * 
 * const addItem = (product) => {
 *   dispatch(addToCart({ product }));
 *   toast.success(`${product.name} sepete eklendi!`);
 * };
 * 
 * const removeItem = (productId) => {
 *   dispatch(removeFromCart(productId));
 *   toast.error('Ürün sepetten çıkarıldı');
 * };
 */