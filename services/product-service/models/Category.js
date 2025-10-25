const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  slug: { 
    type: String, 
    unique: true, 
    lowercase: true 
  },
  description: String,
  image: {
    url: String,
    public_id: String
  },
  
  // Hiyerarşik yapı için
  parent: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category',
    default: null 
  },
  
  // SEO
  seo: {
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String]
  },
  
  // Sıralama ve görünürlük
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true,index: true },
  isFeatured: { type: Boolean, default: false },
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals - Alt kategoriler
categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

// Indexes
categorySchema.index({ parent: 1 });
categorySchema.index({ order: 1 });


// Hooks
categorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});


module.exports = mongoose.model('Category', categorySchema);