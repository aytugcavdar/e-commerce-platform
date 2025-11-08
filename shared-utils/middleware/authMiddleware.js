const jwt = require("jsonwebtoken");
const { httpStatus } = require("../constants");
const { ResponseFormatter } = require("../helpers");
const CookieHelper = require('../helpers/cookieHelper'); 
class AuthMiddleware {
  static verifyToken(req, res, next) {
    // Cookie'den token al
    const token = CookieHelper.getAccessTokenFromRequest(req);

    if (!token) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json(
          ResponseFormatter.error(
            "Access denied. No token provided.",
            httpStatus.UNAUTHORIZED
          )
        );
    }

    try {
      // Token'ı doğrula
      const decoded = TokenHelper.verifyToken(token);
      req.user = decoded; // ✅ req.user'a kullanıcı bilgisini ekle
      next();
    } catch (error) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json(
          ResponseFormatter.error("Invalid token.", httpStatus.UNAUTHORIZED)
        );
    }
  }
  static isAdmin(req, res, next) {
    if (req.user?.role !== "admin") {
      return res
        .status(httpStatus.FORBIDDEN)
        .json(
          ResponseFormatter.error(
            "Access denied. Admins only.",
            httpStatus.FORBIDDEN
          )
        );
    }
    next();
  }
  static requireRole(allowedRoles) {
    return (req, res, next) => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res
          .status(httpStatus.FORBIDDEN)
          .json(
            ResponseFormatter.error(
              "Forbidden. Insufficient permissions.",
              httpStatus.FORBIDDEN
            )
          );
      }
      next();
    };
  }
}

module.exports = AuthMiddleware;
