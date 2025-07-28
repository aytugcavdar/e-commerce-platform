const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    // Siparişi veren kullanıcı
    userId: {
        type: mongoose.Schema.ObjectId,
        required: true,
        ref: 'User' // Mantıksal referans
    },
    // Sipariş edilen ürünlerin kopyası
    orderItems: [
        {
            name: { type: String, required: true },
            quantity: { type: Number, required: true },
            image: { type: String, required: true },
            price: { type: Number, required: true }, // O anki fiyat
            productId: { // Orijinal ürüne referans
                type: mongoose.Schema.ObjectId,
                required: true,
                ref: 'Product'
            }
        }
    ],
    shippingAddress: {
        address: { type: String, required: true },
        city: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true }
    },
    paymentMethod: {
        type: String,
        required: true,
        default: 'Credit Card'
    },
    // Ödeme sonucu bilgileri (ileride Payment Service'ten gelecek)
    paymentResult: {
        id: { type: String },
        status: { type: String },
        update_time: { type: String },
        email_address: { type: String }
    },
    itemsPrice: { // Ürünlerin vergisiz toplam fiyatı
        type: Number,
        required: true,
        default: 0.0
    },
    taxPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    shippingPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    totalPrice: { // Her şey dahil toplam fiyat
        type: Number,
        required: true,
        default: 0.0
    },
    orderStatus: {
        type: String,
        required: true,
        enum: ['Ödeme Bekliyor', 'Başarısız', 'Hazırlanıyor', 'Kargoda', 'Teslim Edildi', 'İptal Edildi'],
        default: 'Ödeme Bekliyor'
    },
    isPaid: {
        type: Boolean,
        required: true,
        default: false
    },
    paidAt: {
        type: Date
    },
    isDelivered: {
        type: Boolean,
        required: true,
        default: false
    },
    deliveredAt: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Order', OrderSchema);