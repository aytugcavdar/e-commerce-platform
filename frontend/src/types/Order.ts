export interface OrderItem {
    name: string;
    quantity: number;
    image: string;
    price: number;
    productId: string;
}

export interface ShippingAddress {
    address: string;
    city: string;
    postalCode: string;
    country: string;
}


export interface Order {
    _id: string;
    userId: string;
    orderItems: OrderItem[];
    shippingAddress: ShippingAddress;
    paymentMethod: string;
    totalPrice: number;
    orderStatus: 'Ödeme Bekliyor' | 'Başarısız' | 'Hazırlanıyor' | 'Kargoda' | 'Teslim Edildi' | 'İptal Edildi';
    isPaid: boolean;
    paidAt?: string;
    isDelivered: boolean;
    deliveredAt?: string;
    createdAt: string;
    updatedAt: string;
}