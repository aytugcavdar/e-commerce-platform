
const mongoose = require('mongoose');



const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discountPrice: {
    type: Number,
    min: 0
  },
  image: String,
  brand: String,
  category: String
}, { _id: true });

const orderSchema = new mongoose.Schema({
  // Order identification
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },

  // User information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Order items
  items: [orderItemSchema],

  // Pricing
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  shippingCost: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },

  // Shipping address
  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'Turkey' }
  },

  // Billing address (optional - can be same as shipping)
  billingAddress: {
    fullName: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },

  // Payment information
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'bank_transfer', 'cash_on_delivery'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
    index: true
  },
  paymentDetails: {
    transactionId: String,
    paymentDate: Date,
    cardLastFour: String,
    cardBrand: String
  },

  // Order status
  status: {
    type: String,
    enum: [
      'pending',           // Sipariş oluşturuldu
      'confirmed',         // Sipariş onaylandı
      'processing',        // Hazırlanıyor
      'shipped',           // Kargoya verildi
      'out_for_delivery',  // Dağıtımda
      'delivered',         // Teslim edildi
      'cancelled',         // İptal edildi
      'returned',          // İade edildi
      'refunded'           // İade tamamlandı
    ],
    default: 'pending',
    index: true
  },

  // Status history for tracking
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Shipping information
  shipping: {
    carrier: String,        // Kargo firması
    trackingNumber: String, // Takip numarası
    estimatedDelivery: Date,
    actualDelivery: Date,
    shippingMethod: {
      type: String,
      enum: ['standard', 'express', 'overnight'],
      default: 'standard'
    }
  },

  // Coupon/Discount
  coupon: {
    code: String,
    discount: Number,
    type: {
      type: String,
      enum: ['percentage', 'fixed']
    }
  },

  // Additional information
  notes: String,           // Müşteri notu
  internalNotes: String,   // Admin notu
  
  // Cancellation
  cancellationReason: String,
  cancelledAt: Date,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Timestamps
  confirmedAt: Date,
  shippedAt: Date,
  deliveredAt: Date

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for items count
orderSchema.virtual('itemsCount').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for final price per item
orderItemSchema.virtual('finalPrice').get(function() {
  return this.discountPrice || this.price;
});

// Virtual for item total
orderItemSchema.virtual('itemTotal').get(function() {
  return this.finalPrice * this.quantity;
});

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });

orderSchema.index({ status: 1, createdAt: -1 });



orderSchema.pre('save', async function(next) {
  
  if (this.isNew && !this.orderNumber) {
    const today = new Date();
    
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const datePrefix = `ORD-${year}${month}${day}-`; 
    
    const lastOrder = await this.constructor
      .findOne({ orderNumber: { $regex: `^${datePrefix}` } }) 
      .sort({ createdAt: -1 }) 
      .select('orderNumber');

    let sequence = 1;
    if (lastOrder && lastOrder.orderNumber) {
      try {
        const lastSequence = parseInt(lastOrder.orderNumber.split('-').pop());
        sequence = lastSequence + 1;
      } catch (e) {
         logger.warn('Could not parse last order sequence, starting from 1.');
         sequence = 1; 
      }
    }

    
    this.orderNumber = `${datePrefix}${String(sequence).padStart(4, '0')}`;
  }
  next();
});

// Pre-save middleware - Add to status history
orderSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date()
    });
    
    // Set timestamp fields based on status
    if (this.status === 'confirmed' && !this.confirmedAt) {
      this.confirmedAt = new Date();
    } else if (this.status === 'shipped' && !this.shippedAt) {
      this.shippedAt = new Date();
    } else if (this.status === 'delivered' && !this.deliveredAt) {
      this.deliveredAt = new Date();
    } else if (this.status === 'cancelled' && !this.cancelledAt) {
      this.cancelledAt = new Date();
    }
  }
  next();
});

// Instance methods
orderSchema.methods.canBeCancelled = function() {
  return ['pending', 'confirmed', 'processing'].includes(this.status);
};

orderSchema.methods.canBeReturned = function() {
  if (this.status !== 'delivered') return false;
  
  // Can return within 14 days of delivery
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  
  return this.deliveredAt && this.deliveredAt > fourteenDaysAgo;
};

orderSchema.methods.updateStatus = async function(newStatus, note, updatedBy) {
  this.status = newStatus;
  
  if (note || updatedBy) {
    this.statusHistory.push({
      status: newStatus,
      timestamp: new Date(),
      note,
      updatedBy
    });
  }
  
  return this.save();
};

// Static methods
orderSchema.statics.getOrderStats = async function(userId) {
  return this.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        total: { $sum: '$total' }
      }
    }
  ]);
};

orderSchema.statics.getRevenueByPeriod = async function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        paymentStatus: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$total' },
        orderCount: { $sum: 1 },
        averageOrderValue: { $avg: '$total' }
      }
    }
  ]);
};

module.exports = mongoose.model('Order', orderSchema);