const mongoose = require('mongoose');
const slugify = require('slugify');

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Lütfen bir kategori adı girin'],
        trim: true
        
    },
    slug: String,
    description: {
        type: String,
        maxlength: [500, 'Açıklama 500 karakterden fazla olamaz']
    },
    parent: {
        type: mongoose.Schema.ObjectId,
        ref: 'Category',
        default: null
    },
    user: {
        type: mongoose.Schema.ObjectId,
        required: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Slug oluşturma
CategorySchema.pre('save', function(next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

// Virtual alan: Alt kategorileri getirmek için
CategorySchema.virtual('children', {
    ref: 'Category',
    localField: '_id',
    foreignField: 'parent',
    justOne: false
});

// Index'ler

CategorySchema.index({ name: 1, parent: 1 }, { unique: true });
CategorySchema.index({ slug: 1 });
CategorySchema.index({ parent: 1 });
CategorySchema.index({ user: 1 });

module.exports = mongoose.model('Category', CategorySchema);