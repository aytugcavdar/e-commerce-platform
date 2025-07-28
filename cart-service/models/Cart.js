const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
    // Product Service'teki ürünün ID'si
    productId: {
        type: mongoose.Schema.ObjectId,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    image: {
        type: String // Ürünün ana resminin URL'i
    }
});


const CartSchema = new mongoose.Schema({
    // Auth Service'teki kullanıcının ID'si
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User', // Mantıksal referans
        required: true,
        unique: true
    },
    items: [CartItemSchema],
    // Sepet her güncellendiğinde bu tarih de güncellenecek
    modifiedOn: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Sanal Alan: Sepetin Toplam Tutarını Hesapla
CartSchema.virtual('totalPrice').get(function() {
    return this.items.reduce((total, item) => {
        return total + (item.quantity * item.price);
    }, 0);
});


module.exports = mongoose.model('Cart', CartSchema);