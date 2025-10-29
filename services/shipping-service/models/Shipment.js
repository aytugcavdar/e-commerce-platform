const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order', // Order servisteki modele referans
    required: true,
    unique: true, // Her sipariş için bir kargo kaydı olmalı
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // User servisteki modele referans
    required: true,
  },
  shippingAddress: { // Siparişteki adres buraya kopyalanır
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  status: {
    type: String,
    enum: [
      'pending',          // Kargo işlemi bekleniyor
      'processing',       // Kargo hazırlanıyor (etiket oluşturma vb.)
      'shipped',          // Kargoya verildi
      'in_transit',       // Yolda
      'out_for_delivery', // Dağıtımda
      'delivered',        // Teslim edildi
      'failed',           // Teslimat başarısız
      'cancelled'         // Kargo iptal edildi (sipariş iptali vb.)
    ],
    default: 'pending',
    index: true,
  },
  carrier: String,        // Kargo firması (örn: 'aras', 'mng', 'yurtici')
  trackingNumber: {
    type: String,
    index: true,
  },
  trackingUrl: String,      // Kargo takip linki
  shippingCost: Number,     // Siparişteki kargo ücreti
  estimatedDeliveryDate: Date,
  actualDeliveryDate: Date,
  // Kargo paketi detayları (opsiyonel)
  weight: Number, // kg
  dimensions: {
    length: Number, // cm
    width: Number,
    height: Number,
  },
  statusHistory: [{ // Kargo durumu geçmişi
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    location: String, // Kargonun bulunduğu yer (API'den gelirse)
    notes: String,
  }],
}, {
  timestamps: true,
});

shipmentSchema.pre('save', function (next) {
  // Durum değiştiğinde geçmişe ekle
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date()
      // location ve notes dışarıdan set edilebilir
    });
  }
  next();
});

module.exports = mongoose.model('Shipment', shipmentSchema);