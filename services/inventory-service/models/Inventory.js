// services/inventory-service/models/Inventory.js

const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    unique: true,
    index: true,
  },
  stockQuantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  reservedQuantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  // Düşük Stok Uyarısı Eşiği (EKLENDİ) ✅
  lowStockThreshold: {
    type: Number,
    min: 0,
    // default: 5 // İstersen bir varsayılan değer atayabilirsin
  },
}, {
  timestamps: true,
});

// Satılabilir (Available) Stok (Virtual) ✅
inventorySchema.virtual('availableQuantity').get(function() {
  return Math.max(0, this.stockQuantity - this.reservedQuantity);
});

// Düşük Stok Durumu (Virtual) (EKLENDİ) ✅
// Satılabilir stok, eşik değerin altına düştü mü diye kontrol eder.
inventorySchema.virtual('isLowStock').get(function() {
  // Eşik değer tanımlanmamışsa veya 0 ise, bu kontrolü atla (false döndür).
  if (typeof this.lowStockThreshold !== 'number' || this.lowStockThreshold <= 0) {
    return false;
  }
  return this.availableQuantity < this.lowStockThreshold;
});

module.exports = mongoose.model('Inventory', inventorySchema);