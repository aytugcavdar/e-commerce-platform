const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Ürün adı zorunludur"],
      trim: true,
      minlength: [3, "Ürün adı en az 3 karakter olmalıdır"],
      maxlength: [200, "Ürün adı en fazla 200 karakter olabilir"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, "Ürün açıklaması zorunludur"],
      minlength: [10, "Açıklama en az 10 karakter olmalıdır"],
    },
    price: {
      type: Number,
      required: [true, "Fiyat zorunludur"],
      min: [0, "Fiyat negatif olamaz"],
    },
    discountPrice: {
      type: Number,
      min: [0, "İndirimli fiyat negatif olamaz"],
      validate: {
        validator: function (value) {
          return !value || value < this.price;
        },
        message: "İndirimli fiyat normal fiyattan düşük olmalıdır",
      },
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Kategori zorunludur"],
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    images: [
      {
        url: { type: String, required: true }, // Resmin Cloudinary URL'i
        public_id: { type: String, required: true }, // Cloudinary'de silmek için ID
        isMain: { type: Boolean, default: false }, // Ana resim mi?
      },
    ],
    stock: {
      type: Number,
      required: [true, "Stok bilgisi zorunludur"],
      min: [0, "Stok negatif olamaz"],
      default: 0,
    },
    specifications: {
      type: Map,
      of: String,
    },
    tags: [String],
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    shipping: {
      weight: Number, // kg
      dimensions: {
        length: Number, // cm
        width: Number,
        height: Number,
      },
      freeShipping: {
        type: Boolean,
        default: false,
      },
      shippingCost: {
        type: Number,
        default: 0,
      },
    },
    seo: {
      metaTitle: String,
      metaDescription: String,
      metaKeywords: [String],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "out-of-stock", "discontinued"],
      default: "active",
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.virtual("finalPrice").get(function () {
  return this.discountPrice || this.price;
});

productSchema.virtual("discountPercentage").get(function () {
  if (!this.discountPrice) return 0;
  return Math.round(((this.price - this.discountPrice) / this.price) * 100);
});

roductSchema.virtual("isInStock").get(function () {
  return this.stock > 0;
});

// Indexes
productSchema.index({ name: "text", description: "text", tags: "text" });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ "ratings.average": -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ slug: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ sku: 1 }, { unique: true, sparse: true });
productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });
// Hooks
productSchema.pre("save", function (next) {
  if (this.isModified("name") && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // Ana resim kontrolü
  if (this.images && this.images.length > 0) {
    const hasMain = this.images.some((img) => img.isMain);
    if (!hasMain) {
      this.images[0].isMain = true;
    }
  }

  next();
});

productSchema.methods.decreaseStock = async function (quantity) {
  if (this.stock < quantity) {
    throw new Error("Yetersiz stok");
  }
  this.stock -= quantity;
  this.salesCount += quantity;

  if (this.stock === 0) {
    this.status = "out-of-stock";
  }

  return this.save();
};

productSchema.methods.increaseStock = async function (quantity) {
  this.stock += quantity;

  if (this.status === "out-of-stock" && this.stock > 0) {
    this.status = "active";
  }

  return this.save();
};

module.exports = mongoose.model("Product", productSchema);
