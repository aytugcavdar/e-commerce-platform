const mongoose = require('mongoose');
const slugify = require('slugify'); // Marka slug'ı için

const brandSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, unique: true, lowercase: true },
  logoUrl: String,
  description: String,
  website: String,
}, { timestamps: true });

brandSchema.pre('save', function(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model('Brand', brandSchema);