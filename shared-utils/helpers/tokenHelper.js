const jwt = require('jsonwebtoken');
const logger = require('../logger');

class TokenHelper {
  static generateToken(payload, expiresIn = '7d') {
    try {
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn,
        algorithm: 'HS256'
      });
      return token;
    } catch (error) {
      logger.error('Failed to generate token:', error);
      throw error;
    }
  }

  static verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded;
    } catch (error) {
      logger.error('Token verification failed:', error.message);
      throw error;
    }
  }

  static decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      logger.error('Token decode failed:', error);
      throw error;
    }
  }

  static isTokenExpired(token) {
    try {
      const decoded = this.decodeToken(token);
      return Date.now() >= decoded.exp * 1000;
    } catch (error) {
      return true;
    }
  }

  static generateRefreshToken(userId) {
    return this.generateToken({ userId, type: 'refresh' }, '30d');
  }

  static generateAccessToken(user) {
    return this.generateToken({
      userId: user._id,
      email: user.email,
      role: user.role,
      type: 'access'
    }, '7d');
  }
}

module.exports = TokenHelper;