// frontend/src/features/cart/types/cart.types.ts

/**
 * 🎓 ÖĞREN: Sepet Tipleri
 *
 * Sepet sistemi, e-ticaretin temel taşlarından biridir.
 * Tipler, sepetteki ürünleri ve sepetin genel durumunu (toplam fiyat vb.) yönetir.
 */

/**
 * 🛒 CartItem
 *
 * Sepete eklenen her bir ürünün yapısı.
 * Ürünün kendisinden (Product) bazı bilgileri alır (fiyat, stok, resim)
 * ve ek olarak "quantity" (adet) bilgisi tutar.
 */
export interface CartItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  stock: number; // Kullanıcının stoktan fazla eklemesini önlemek için
  quantity: number;
}

/**
 * 🏬 CartState
 *
 * Sepetin Redux slice'ı için state yapısı.
 */
export interface CartState {
  items: CartItem[]; // Sepetteki ürünlerin dizisi
  loading: boolean;
  error: string | null;

  // 💡 PRO TIP: Bu değerler state'te tutulabilir veya selector'ler ile
  // her render'da 'items' dizisinden hesaplanabilir (reselect).
  // Başlangıç için state'te tutmak daha kolay olabilir.
  totalItems: number;
  totalPrice: number;
  
  // Kargo, vergi vb. bilgiler de buraya eklenebilir
  shippingPrice: number;
  taxPrice: number;
}