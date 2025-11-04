// frontend/src/features/orders/types/order.types.ts

import type { User } from '@/features/auth/types/auth.types';

/**
 * 🎓 ÖĞREN: Sipariş Tipleri
 *
 * Sipariş (Order) yapısı, bir işlemin (transaction) tüm bileşenlerini içerir:
 * 1. Kimin verdiği (User)
 * 2. Neler aldığı (OrderItems)
 * 3. Nereye gönderileceği (ShippingAddress)
 * 4. Nasıl ödendiği (Payment)
 * 5. Mevcut durumu (Status)
 */

/**
 * 📦 OrderItem
 *
 * Sipariş verildiği andaki ürün bilgisi.
 * Fiyatın değişme ihtimaline karşı, o anki fiyatı kaydeder.
 */
export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  price: number; // Sipariş anındaki fiyat
  quantity: number;
}

/**
 * 🚚 ShippingAddress
 *
 * Teslimat adresi yapısı.
 */
export interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone?: string;
}

/**
 * 💳 PaymentResult
 *
 * Ödeme sağlayıcıdan (Stripe, Iyzico vb.) dönen sonuç.
 */
export interface PaymentResult {
  id: string; // Ödeme ID'si
  status: string; // 'succeeded', 'pending', 'failed'
  update_time: string;
  email_address?: string;
}

/**
 * 🚦 OrderStatus
 *
 * Siparişin yaşam döngüsündeki durumlar.
 */
export type OrderStatus =
  | 'pending' // Ödeme bekleniyor
  | 'paid' // Ödendi
  | 'shipped' // Kargolandı
  | 'delivered' // Teslim edildi
  | 'cancelled'; // İptal edildi

/**
 * 📄 Order (Ana Sipariş Modeli)
 *
 * Backend'den gelen ana sipariş objesi.
 */
export interface Order {
  _id: string;
  user: User | string; // Populated (dolu) veya sadece ID
  orderItems: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string; // 'credit_card', 'paypal'
  paymentResult?: PaymentResult;

  itemsPrice: number; // Ürünlerin toplam fiyatı
  shippingPrice: number; // Kargo ücreti
  taxPrice: number; // Vergi
  totalPrice: number; // Toplam

  status: OrderStatus;
  
  paidAt?: string | Date;
  shippedAt?: string | Date;
  deliveredAt?: string | Date;

  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * 📊 OrderState
 *
 * Siparişlerin Redux slice'ı için state yapısı.
 */
export interface OrderState {
  orders: Order[]; // Kullanıcının tüm siparişleri
  selectedOrder: Order | null; // Sipariş detay sayfasında bakılan
  loading: boolean; // Sipariş listesi yükleniyor
  loadingDetails: boolean; // Sipariş detayı yükleniyor
  error: string | null;

  // Checkout (Ödeme) süreci için
  checkoutLoading: boolean;
  checkoutError: string | null;
  checkoutSuccess: boolean;
}