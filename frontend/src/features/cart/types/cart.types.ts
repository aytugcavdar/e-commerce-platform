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
 * 📦 OrderItem - Siparişteki Tek Bir Ürün
 *
 * Sipariş verildiği andaki ürün bilgisi.
 * Fiyatın değişme ihtimaline karşı, o anki fiyatı kaydeder.
 */
export interface OrderItem {
  productId: string;
  name: string;
  slug: string;
  image: string;
  price: number;              // Sipariş anındaki fiyat (KDV dahil)
  quantity: number;
  subtotal: number;           // price * quantity
}

/**
 * 🚚 ShippingAddress - Teslimat Adresi
 *
 * Teslimat adresi yapısı.
 */
export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  postalCode: string;
  country: string;
  addressTitle?: string;      // "Ev", "İş" vb.
}

/**
 * 💳 PaymentMethod - Ödeme Yöntemi
 */
export type PaymentMethodType = 
  | 'credit_card' 
  | 'debit_card' 
  | 'bank_transfer' 
  | 'cash_on_delivery';

export interface PaymentMethod {
  type: PaymentMethodType;
  cardNumber?: string;        // Son 4 hane (örn: "**** 1234")
  cardHolderName?: string;
  cardBrand?: string;         // "Visa", "Mastercard"
}

/**
 * 💰 PaymentResult - Ödeme Sonucu
 *
 * Ödeme sağlayıcıdan (Stripe, Iyzico vb.) dönen sonuç.
 */
export interface PaymentResult {
  id: string;                 // Ödeme ID'si
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled';
  transactionId?: string;     // Banka işlem no
  paidAt?: string | Date;
  errorMessage?: string;
}

/**
 * 🚦 OrderStatus - Sipariş Durumu
 *
 * Siparişin yaşam döngüsündeki durumlar.
 */
export type OrderStatus =
  | 'pending'           // Ödeme bekleniyor
  | 'payment_failed'    // Ödeme başarısız
  | 'confirmed'         // Sipariş onaylandı
  | 'preparing'         // Hazırlanıyor
  | 'shipped'           // Kargolandı
  | 'delivered'         // Teslim edildi
  | 'cancelled'         // İptal edildi
  | 'refunded';         // İade edildi

/**
 * 📊 OrderStatusInfo - Sipariş Durumu Bilgisi (Frontend için)
 */
export interface OrderStatusInfo {
  status: OrderStatus;
  label: string;
  color: string;
  icon: string;
  description: string;
}

/**
 * 📄 Order - Ana Sipariş Modeli
 *
 * Backend'den gelen ana sipariş objesi.
 */
export interface Order {
  _id: string;
  orderNumber: string;        // Sipariş numarası (örn: "ORD-2024-001234")
  
  // Kullanıcı
  user: User | string;        // Populated (dolu) veya sadece ID
  
  // Ürünler
  items: OrderItem[];
  
  // Adres ve Ödeme
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  paymentResult?: PaymentResult;
  
  // Fiyatlar
  itemsPrice: number;         // Ürünlerin toplam fiyatı
  shippingPrice: number;      // Kargo ücreti
  taxPrice: number;           // Vergi (KDV)
  discountPrice: number;      // İndirim (kupon)
  totalPrice: number;         // Ödenecek toplam
  
  // Durum
  status: OrderStatus;
  
  // Kupon
  couponCode?: string;
  
  // Kargo Takip
  trackingNumber?: string;
  shippingCompany?: string;
  
  // Notlar
  notes?: string;             // Kullanıcı notu
  adminNotes?: string;        // Admin notu
  
  // Tarihler
  paidAt?: string | Date;
  shippedAt?: string | Date;
  deliveredAt?: string | Date;
  cancelledAt?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * 📊 OrdersState - Redux State Yapısı
 *
 * Siparişlerin Redux slice'ı için state yapısı.
 */
export interface OrdersState {
  // Sipariş Listesi
  orders: Order[];
  selectedOrder: Order | null;
  
  // Loading States
  loading: boolean;
  loadingDetails: boolean;
  creatingOrder: boolean;
  
  // Error States
  error: string | null;
  orderError: string | null;
  
  // Pagination
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  
  // Filters
  filters: {
    status?: OrderStatus;
    search?: string;
    startDate?: string;
    endDate?: string;
  };
}

/**
 * 🛒 CreateOrderRequest - Sipariş Oluşturma İsteği
 */
export interface CreateOrderRequest {
  items: {
    productId: string;
    quantity: number;
  }[];
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  notes?: string;
}

/**
 * 📥 CreateOrderResponse - Sipariş Oluşturma Cevabı
 */
export interface CreateOrderResponse {
  success: boolean;
  message: string;
  data: {
    order: Order;
    paymentUrl?: string;      // Ödeme sayfası URL (3D Secure için)
  };
}

/**
 * 🎯 ORDER STATUS MAP - Durum Bilgileri
 */
export const ORDER_STATUS_MAP: Record<OrderStatus, OrderStatusInfo> = {
  pending: {
    status: 'pending',
    label: 'Ödeme Bekleniyor',
    color: 'yellow',
    icon: '⏳',
    description: 'Ödemeniz alınmayı bekliyor',
  },
  payment_failed: {
    status: 'payment_failed',
    label: 'Ödeme Başarısız',
    color: 'red',
    icon: '❌',
    description: 'Ödeme işlemi başarısız oldu',
  },
  confirmed: {
    status: 'confirmed',
    label: 'Sipariş Onaylandı',
    color: 'blue',
    icon: '✓',
    description: 'Siparişiniz onaylandı, hazırlanıyor',
  },
  preparing: {
    status: 'preparing',
    label: 'Hazırlanıyor',
    color: 'purple',
    icon: '📦',
    description: 'Siparişiniz hazırlanıyor',
  },
  shipped: {
    status: 'shipped',
    label: 'Kargoya Verildi',
    color: 'indigo',
    icon: '🚚',
    description: 'Siparişiniz kargoya verildi',
  },
  delivered: {
    status: 'delivered',
    label: 'Teslim Edildi',
    color: 'green',
    icon: '✅',
    description: 'Siparişiniz teslim edildi',
  },
  cancelled: {
    status: 'cancelled',
    label: 'İptal Edildi',
    color: 'gray',
    icon: '🚫',
    description: 'Sipariş iptal edildi',
  },
  refunded: {
    status: 'refunded',
    label: 'İade Edildi',
    color: 'orange',
    icon: '↩️',
    description: 'Ödeme iade edildi',
  },
};

/**
 * 🎯 KULLANIM ÖRNEKLERİ:
 * 
 * // Sipariş oluştur
 * const orderRequest: CreateOrderRequest = {
 *   items: [
 *     { productId: '507f...', quantity: 2 }
 *   ],
 *   shippingAddress: {
 *     fullName: 'Ahmet Yılmaz',
 *     phone: '5551234567',
 *     address: 'Atatürk Cad. No: 123',
 *     city: 'İstanbul',
 *     district: 'Kadıköy',
 *     postalCode: '34000',
 *     country: 'Türkiye'
 *   },
 *   paymentMethod: {
 *     type: 'credit_card',
 *     cardNumber: '**** 1234',
 *     cardBrand: 'Visa'
 *   }
 * };
 * 
 * // Sipariş durumu badge
 * const statusInfo = ORDER_STATUS_MAP[order.status];
 * <span className={`bg-${statusInfo.color}-100`}>
 *   {statusInfo.icon} {statusInfo.label}
 * </span>
 */

/**
 * 💡 PRO TIP: Sipariş Numarası Formatı
 * 
 * Backend'de unique sipariş numarası oluştur:
 * 
 * ORD-2024-001234
 * ORD-YYYY-XXXXXX
 * 
 * const generateOrderNumber = () => {
 *   const year = new Date().getFullYear();
 *   const count = await Order.countDocuments();
 *   return `ORD-${year}-${String(count + 1).padStart(6, '0')}`;
 * };
 */