const mongoose = require('mongoose');

// Bu model, product-service'teki ürünlerin bir kopyasını tutar.
// Sadece sepet için gerekli olan alanları içerir.
const ProductCacheSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.ObjectId, alias: 'productId' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String },
    stock: { type: Number, required: true, default: 0 }
}, {
    _id: false, // _id'yi productId olarak kullanacağız
    timestamps: true
});

module.exports = mongoose.model('ProductCache', ProductCacheSchema);