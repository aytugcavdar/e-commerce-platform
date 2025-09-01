const User = require('../models/User');
const { ErrorResponse, asyncHandler } = require('@e-commerce/shared-utils');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

/**
 * @desc    Kullanıcının kendi profilini güncellemesi
 * @route   PUT /api/users/updateme
 * @access  Private
 */
exports.updateMe = asyncHandler(async (req, res, next) => {
    const { firstName, lastName, username } = req.body;
    const fieldsToUpdate = {};

    if (firstName) fieldsToUpdate.firstName = firstName;
    if (lastName) fieldsToUpdate.lastName = lastName;
    if (username) fieldsToUpdate.username = username;

    // Avatar güncelleme
    if (req.file) {
        try {
            const userForAvatar = await User.findById(req.user.id);
            // Eski avatarı sil
            if (userForAvatar.avatar && userForAvatar.avatar.public_id) {
                await cloudinary.uploader.destroy(userForAvatar.avatar.public_id);
            }

            // Yeni avatarı yükle
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: "ecommerce_avatars",
                width: 500,
                crop: "limit"
            });
            
            fieldsToUpdate.avatar = {
                public_id: result.public_id,
                url: result.secure_url
            };

            // Geçici dosyayı sil
            fs.unlinkSync(req.file.path);

        } catch (error) {
            return next(new ErrorResponse('Avatar yüklenirken bir hata oluştu.', 500));
        }
    }
    
    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
        new: true,
        runValidators: true
    });

    res.status(200).json({ success: true, data: { user } });
});


/**
 * @desc    Tüm kullanıcıları getir (Admin)
 * @route   GET /api/users
 * @access  Private/Admin
 */
exports.getUsers = asyncHandler(async (req, res, next) => {
    res.status(200).json(res.advancedResults); // Bu satır advancedResults middleware'i ile çalışır
});

/**
 * @desc    Tek bir kullanıcıyı getir (Admin)
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
exports.getUser = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new ErrorResponse(`ID'si ${req.params.id} olan kullanıcı bulunamadı`, 404));
    }

    res.status(200).json({ success: true, data: user });
});

/**
 * @desc    Kullanıcıyı güncelle (Admin)
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
exports.updateUser = asyncHandler(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({ success: true, data: user });
});

/**
 * @desc    Kullanıcıyı sil (Admin)
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
exports.deleteUser = asyncHandler(async (req, res, next) => {
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, data: {} });
});
// @desc      Update user profile
// @route     PUT /api/v1/users/profile
// @access    Private
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { name, email, address } = req.body;

  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  user.name = name || user.name;
  user.email = email || user.email;
  user.address = address || user.address;

  await user.save();

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc      Add/remove product to/from favorites
// @route     PUT /api/v1/users/favorites
// @access    Private
exports.updateFavorites = asyncHandler(async (req, res, next) => {
  const { productId } = req.body;
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  const index = user.favorites.indexOf(productId);

  if (index === -1) {
    // Add to favorites
    user.favorites.push(productId);
  } else {
    // Remove from favorites
    user.favorites.splice(index, 1);
  }

  await user.save();

  res.status(200).json({
    success: true,
    data: user.favorites,
  });
});