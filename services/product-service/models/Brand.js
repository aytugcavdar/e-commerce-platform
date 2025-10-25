const mongoose = require('mongoose');
const slugify = require('slugify');

const brandSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [ true, "Marka adı zorunludur"], 
    unique: true, 
    trim: true 
  },
  slug: { 
    type: String, 
    unique: true, 
    lowercase: true 
  },
  logo: {
    url: String,
    public_id: String
  },
  description: String,
  website: String,
  
  // ✅ Sosyal medya
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String
  },

  
  isActive: { type: Boolean, default: true, index: true },
  isFeatured: { type: Boolean, default: false },
}, { timestamps: true });

brandSchema.pre('save', function(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

brandSchema.index({ isActive: 1 });

module.exports = mongoose.model('Brand', brandSchema);