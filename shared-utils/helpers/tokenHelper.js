const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('../logger');

class TokenHelper {
  static generateToken(payload, expiresIn = process.env.JWT_EXPIRE || '7d') {
    try {
      if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET environment variable is not set.');
      return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn, algorithm: 'HS256' });
    } catch (error) {
      logger.error('❌ Failed to generate JWT:', error);
      throw new Error('Could not generate JWT');
    }
  }

  static verifyToken(token) {
    try {
      if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET environment variable is not set.');
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      logger.warn(`JWT verification failed: ${error.message}`);
      return null;
    }
  }

  static decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      logger.error('JWT decode failed:', error);
      return null;
    }
  }

  static isTokenExpired(token) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || typeof decoded.exp === 'undefined') return true;
      return Date.now() >= decoded.exp * 1000;
    } catch (error) {
      return true;
    }
  }

  static generateAccessToken(user) {
    const payload = {
      userId: user._id || user.id,
      email: user.email,
      role: user.role,
      type: 'access',
    };
    return this.generateToken(payload, process.env.JWT_ACCESS_EXPIRE || '15m');
  }

  static generateRefreshToken(userId) {
    const payload = { userId, type: 'refresh' };
    return this.generateToken(payload, process.env.JWT_REFRESH_EXPIRE || '7d');
  }

  static createCryptoToken(bytes = 32, durationHours = 24) {
    const rawToken = crypto.randomBytes(bytes).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date(Date.now() + durationHours * 60 * 60 * 1000);
    return { rawToken, hashedToken, expires };
  }

  static createVerificationToken() {
    return this.createCryptoToken(32, 24);
  }

  static createPasswordResetToken() {
    return this.createCryptoToken(32, 1);
  }

  static hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static isVerificationTokenExpired(expiresDate) {
    if (!expiresDate || !(expiresDate instanceof Date)) {
        return true;
    }
    return Date.now() > expiresDate.getTime();
  }
}

module.exports = TokenHelper;
