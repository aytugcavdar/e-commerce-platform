const mongoose = require('mongoose');
const { helpers } = require('@ecommerce/shared-utils');
const { PasswordUtils } = helpers;

const userSchema = new mongoose.Schema(
    {
        firstName: {
    type: String,
    required: [true, 'Adı giriniz'],
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  lastName: {
    type: String,
    required: [true, 'Soyadı giriniz'],
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  email: {
    type: String,
    required: [true, 'E-posta giriniz'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Geçerli bir e-posta adresi giriniz',
    ],
  },
  password: {
    type: String,
    required: [true, 'Şifre giriniz'],
    minlength: 8,
    select: false, // Default olarak döndürme
  },
  phone: {
    type: String,
    match: [/^(\+90|0)?[1-9]\d{9}$/, 'Geçerli bir telefon numarası giriniz'],
  },
  avatarUrl: {
    type: String,
    
    default: function() {
      const fullName = `${this.firstName} ${this.lastName}`.replace(/\s+/g, '+');
      return `https://ui-avatars.com/api/?name=${fullName}&background=random`;
    }
  },
  role: {
    type: String,
    enum: ['customer', 'admin', 'seller'],
    default: 'customer',
  },
   addresses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address',
  }],
  defaultAddress: mongoose.Schema.Types.ObjectId,
  
  // Verification and Security
  emailVerificationToken: String,
  emailVerificationExpires: Date,
    passwordResetToken: String,
  passwordResetExpires: Date,

  // Status Flags
  isActive: {
    type: Boolean,
    default: true,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  blockReason: String,
  loginAttempts: {
    type: Number,
    default: 0,
    select: false,
  },
  lockUntil: {
    type: Date,
    select: false,
  },
  lastLogin: Date,
 preferences: {
    newsletter: { type: Boolean, default: true },
    notifications: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: true },
  },
  
  // Stats
  totalOrders: {
    type: Number,
    default: 0,
  },
  totalSpent: {
    type: Number,
    default: 0,
  },

  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});


userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    this.password = await PasswordUtils.hash(this.password);
    next();
  } catch (error) {
    next(error);
  }
});
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await PasswordUtils.compare(enteredPassword, this.password);
};

userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.emailVerificationToken;
  delete userObject.emailVerificationExpires;
    delete userObject.passwordResetToken;
    delete userObject.passwordResetExpires;
  delete userObject.loginAttempts;
  delete userObject.lockUntil;
  delete userObject.__v;
  return userObject;
};

userSchema.methods.handleFailedLogin = async function () {
  this.loginAttempts += 1;
  
  if (this.loginAttempts >= 5) {
    this.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 saat
  }
  
  return this.save();
};
userSchema.methods.resetLoginAttempts = async function () {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  this.lastLogin = new Date();
  return this.save();
};
module.exports = mongoose.model('User', userSchema);