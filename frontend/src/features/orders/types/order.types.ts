// frontend/src/features/orders/types/order.types.ts

/**
 * 🎓 ÖĞREN: Sipariş Tipleri (Güncellenmiş)
 */

/**
 * 📦 Order Item
 */
export interface OrderItem {
  product: string;
  name: string;
  slug: string;
  quantity: number;
  price: number;
  discountPrice?: number;
  image: string;
  subtotal: number;
}

/**
 * 🚚 Shipping Address
 */
export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  postalCode: string;
  country: string;
}

/**
 * 💳 Payment Method
 */
export type PaymentMethodType = 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash_on_delivery';

export interface PaymentMethod {
  type: PaymentMethodType;
  cardNumber?: string;
  cardBrand?: string;
}

/**
 * 🚦 Order Status
 */
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'refunded';

/**
 * 💰 Payment Status
 */
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

/**
 * 🎨 Status Config (UI için)
 */
export const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; color: string; icon: string }> = {
  pending: { label: 'Beklemede', color: 'yellow', icon: '⏳' },
  confirmed: { label: 'Onaylandı', color: 'blue', icon: '✅' },
  processing: { label: 'Hazırlanıyor', color: 'blue', icon: '📦' },
  shipped: { label: 'Kargoda', color: 'purple', icon: '🚚' },
  out_for_delivery: { label: 'Dağıtımda', color: 'purple', icon: '🚛' },
  delivered: { label: 'Teslim Edildi', color: 'green', icon: '✅' },
  cancelled: { label: 'İptal Edildi', color: 'red', icon: '❌' },
  returned: { label: 'İade Edildi', color: 'orange', icon: '↩️' },
  refunded: { label: 'İade Edildi', color: 'gray', icon: '💰' },
};

/**
 * 📄 Order (Ana Sipariş Modeli)
 */
export interface Order {
  _id: string;
  orderNumber: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  items: OrderItem[];
  
  // Pricing
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  
  // Addresses
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    district: string;
    postalCode: string;
    country: string;
  };
  
  // Payment
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  
  // Status
  status: OrderStatus;
  
  // Shipping
  trackingNumber?: string;
  carrier?: string;
  
  // Dates
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

/**
 * 📊 Orders State
 */
export interface OrdersState {
  orders: Order[];
  selectedOrder: Order | null;
  loading: boolean;
  loadingDetails: boolean;
  creatingOrder: boolean;
  error: string | null;
  orderError: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filters: {
    status?: OrderStatus;
    search?: string;
  };
}

/**
 * 🛒 Create Order Request
 */
export interface CreateOrderRequest {
  items: Array<{
    product: string;
    quantity: number;
  }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: PaymentMethodType;
  couponCode?: string;
  notes?: string;
}

/**
 * 📤 Create Order Response
 */
export interface CreateOrderResponse {
  success: boolean;
  data: {
    order: Order;
  };
  message: string;
}