// services/user-service/controllers/userController.js
const User = require('../models/User');
const {
  middleware: { asyncHandler },
  helpers: { ResponseFormatter },
  constants: { httpStatus },
  logger,
} = require('@ecommerce/shared-utils');

class UserController {
  /**
   * 1. TÜM KULLANICILARI LİSTELE (Admin)
   * Frontend'in aradığı /api/users/admin/all rotası burayı tetikleyecek.
   */
  static getAllUsers = asyncHandler(async (req, res) => {
    const { search, role } = req.query;

    const query = {};

    if (role && role !== 'all') {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    
    // Not: Normalde burada 'totalOrders' ve 'totalSpent' gibi verileri
    // aggregate ile hesaplamanız gerekir, şimdilik basit tutuyoruz.
    const users = await User.find(query).select('-password');

    logger.info(`Admin ${users.length} kullanıcıyı listeledi.`);

    // Frontend'in beklediği formatta (data.data.users değil, sadece data.data)
    res.status(httpStatus.OK).json(
      ResponseFormatter.success(
        users, // Doğrudan diziyi data'ya koy
        'Kullanıcılar başarıyla listelendi'
      )
    );
  });

  /**
   * 2. KULLANICI ENGELLEME/AKTİF ETME (Admin)
   * Frontend'in aradığı /api/users/admin/toggle-block/:userId rotası burayı tetikleyecek.
   */
  static toggleBlockStatus = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json(
        ResponseFormatter.error('Kullanıcı bulunamadı', httpStatus.NOT_FOUND)
      );
    }
    
    // Adminin kendini engellemesini önle
    if (user.role === 'admin') {
      return res.status(httpStatus.FORBIDDEN).json(
        ResponseFormatter.error('Admin kullanıcıları engellenemez', httpStatus.FORBIDDEN)
      );
    }

    user.isBlocked = !user.isBlocked;
    await user.save({ validateBeforeSave: false });

    logger.info(`Kullanıcı ${user.email} durumu ${user.isBlocked ? 'ENGELLEDİ' : 'AKTİF EDİLDİ'}`);

    res.status(httpStatus.OK).json(
      ResponseFormatter.success(
        user.toJSON(),
        `Kullanıcı ${user.isBlocked ? 'engellendi' : 'aktif edildi'}`
      )
    );
  });
}

module.exports = UserController;