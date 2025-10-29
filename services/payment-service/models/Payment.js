const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order', // Order servisteki Order modeline referans
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // User servisteki User modeline referans
    required: true,
    index: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: 'TRY', // Varsayılan para birimi
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'bank_transfer', 'cash_on_delivery'], // Siparişteki ile aynı olmalı
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'], // Ödeme durumları
    default: 'pending',
    index: true,
  },
  transactionId: { // Ödeme ağ geçidinden dönen ID
    type: String,
    index: true,
  },
  paymentGateway: { // Hangi ödeme ağ geçidinin kullanıldığı (örn: 'stripe', 'iyzico')
    type: String,
  },
  gatewayResponse: { // Ağ geçidinden dönen tüm yanıt (loglama/debug için)
    type: mongoose.Schema.Types.Mixed,
  },
  failureReason: String, // Başarısızlık nedeni
  refundedAmount: {
    type: Number,
    min: 0,
    default: 0,
  },
  refundTransactionId: String, // İade işlemi ID'si
}, {
  timestamps: true,
});

// Sipariş ID'si ve durum bazında indexleme performansı artırabilir
paymentSchema.index({ orderId: 1, status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);