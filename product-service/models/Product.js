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
        default: 0
    },
    images: [{
        public_id: { type: String, required: true },
        url: { type: String, required: true }
    }],
    category: {
        type: mongoose.Schema.ObjectId,
        ref: 'Category', // Artık bir string değil, bir referans
        required: [true, 'Lütfen bir kategori belirtin']
    },
    stock: {
        type: Number,
        required: [true, 'Lütfen stok adedini girin'],
        default: 0
    },
    averageRating: {
        type: Number,
        default: 0
    },
    // Ürünü ekleyen admin'in referansı
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User', // Auth Service veritabanındaki User modeline referans (mantıksal)
        required: true
    }
}, {
    timestamps: true
});

// Slugify middleware'i: Ürün adı kaydedilmeden/güncellenmeden önce slug oluştur.
ProductSchema.pre('save', function(next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

module.exports = mongoose.model('Product', ProductSchema);