const mongoose = require('mongoose');
const slugify = require('slugify');

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Lütfen bir ürün adı girin'],
        trim: true,
        unique: true,
        maxlength: [100, 'Ürün adı en fazla 100 karakter olabilir']
    },
    slug: String, // SEO dostu URL için
    description: {
        type: String,
        required: [true, 'Lütfen bir ürün açıklaması girin'],
        maxlength: [1000, 'Açıklama en fazla 1000 karakter olabilir']
    },
    price: {
        type: Number,
        required: [true, 'Lütfen bir fiyat girin'],
        min: [0, 'Fiyat negatif olamaz'],
        default: 0
    },
    images: [{
        public_id: { 
            type: String, 
            required: true 
        },
        url: { 
            type: String, 
            required: true 
        }
    }],
    // Category bilgisi artık sadece ID olarak tutulacak (mikroservis yapısında)
    categoryId: {
        type: mongoose.Schema.ObjectId,
        required: [true, 'Lütfen bir kategori belirtin']
    },
    // Kategori bilgileri cache için (performans)
    categoryInfo: {
        name: String,
        slug: String,
        // Bu alanlar category service'ten güncellenecek
        _lastUpdated: {
            type: Date,
            default: Date.now
        }
    },
    stock: {
        type: Number,
        required: [true, 'Lütfen stok adedini girin'],
        min: [0, 'Stok negatif olamaz'],
        default: 0
    },
    averageRating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    reviewCount: {
        type: Number,
        default: 0
    },
    // Ürün durumu
    status: {
        type: String,
        enum: ['active', 'inactive', 'out_of_stock'],
        default: 'active'
    },
    // Ürünü ekleyen admin'in referansı
    user: {
        type: mongoose.Schema.ObjectId,
        required: true
    },
    // SEO için ek alanlar
    seoTitle: {
        type: String,
        maxlength: [60, 'SEO başlığı en fazla 60 karakter olabilir']
    },
    seoDescription: {
        type: String,
        maxlength: [160, 'SEO açıklaması en fazla 160 karakter olabilir']
    },
    // Ürün özellikleri (JSON formatında)
    attributes: [{
        name: {
            type: String,
            required: true
        },
        value: {
            type: String,
            required: true
        }
    }],
    // Fiyat geçmişi (fiyat değişikliklerini takip için)
    priceHistory: [{
        price: Number,
        changedAt: {
            type: Date,
            default: Date.now
        },
        changedBy: mongoose.Schema.ObjectId
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual: Ürün URL'i
ProductSchema.virtual('url').get(function() {
    return `/products/${this.slug}`;
});

// Virtual: İndirimli mi?
ProductSchema.virtual('isOnSale').get(function() {
    return this.priceHistory && this.priceHistory.length > 1;
});

// Slugify middleware'i: Ürün adı kaydedilmeden/güncellenmeden önce slug oluştur.
ProductSchema.pre('save', function(next) {
    if (this.isModified('name')) {
        this.slug = slugify(this.name, { lower: true });
    }
    
    // SEO alanları otomatik doldur (eğer boşsa)
    if (this.isModified('name') && !this.seoTitle) {
        this.seoTitle = this.name.length > 60 ? 
            this.name.substring(0, 57) + '...' : 
            this.name;
    }
    
    if (this.isModified('description') && !this.seoDescription) {
        this.seoDescription = this.description.length > 160 ? 
            this.description.substring(0, 157) + '...' : 
            this.description;
    }
    
    next();
});

// Fiyat değişikliği middleware
ProductSchema.pre('save', function(next) {
    if (this.isModified('price') && !this.isNew) {
        // Fiyat geçmişine ekle
        if (!this.priceHistory) {
            this.priceHistory = [];
        }
        
        this.priceHistory.push({
            price: this.price,
            changedBy: this.user
        });
        
        // Son 10 fiyat değişikliğini tut
        if (this.priceHistory.length > 10) {
            this.priceHistory = this.priceHistory.slice(-10);
        }
    }
    next();
});

// Stok durumu middleware
ProductSchema.pre('save', function(next) {
    if (this.isModified('stock')) {
        if (this.stock === 0) {
            this.status = 'out_of_stock';
        } else if (this.status === 'out_of_stock' && this.stock > 0) {
            this.status = 'active';
        }
    }
    next();
});

// Index'ler (performans için)
ProductSchema.index({ slug: 1 });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ user: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ averageRating: -1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ 'categoryInfo.name': 1 });

// Text search index (arama için)
ProductSchema.index({
    name: 'text',
    description: 'text',
    'categoryInfo.name': 'text'
}, {
    weights: {
        name: 10,
        'categoryInfo.name': 5,
        description: 1
    }
});

// Static method: Aktif ürünleri getir
ProductSchema.statics.findActive = function() {
    return this.find({ status: 'active' });
};

// Static method: Stokta olan ürünleri getir
ProductSchema.statics.findInStock = function() {
    return this.find({ stock: { $gt: 0 }, status: 'active' });
};

// Instance method: Ürün stokta mı?
ProductSchema.methods.isInStock = function() {
    return this.stock > 0 && this.status === 'active';
};

// Instance method: Ortalama puanı güncelle
ProductSchema.methods.updateRating = function(newRating, reviewCount) {
    this.averageRating = newRating;
    this.reviewCount = reviewCount;
    return this.save();
};

module.exports = mongoose.model('Product', ProductSchema);