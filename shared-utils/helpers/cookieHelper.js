const { httpStatus } = require('../constants');

class CookieHelper {
  static getCookieOptions(customOptions = {}) {
    const defaultOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    };
    return { ...defaultOptions, ...customOptions };
  }

  static setTokenCookie(res, token, options = {}) {
    const accessExpireMs = parseInt(process.env.JWT_ACCESS_EXPIRE_MS || '900000');
    const cookieOptions = this.getCookieOptions({ maxAge: accessExpireMs, ...options });
    res.cookie('accessToken', token, cookieOptions);
    return res;
  }

  static setRefreshTokenCookie(res, refreshToken, options = {}) {
    const refreshExpireMs = parseInt(process.env.JWT_REFRESH_EXPIRE_MS || '604800000');
    const cookieOptions = this.getCookieOptions({ maxAge: refreshExpireMs, ...options });
    res.cookie('refreshToken', refreshToken, cookieOptions);
    return res;
  }

  static clearCookie(res, cookieName) {
    const options = this.getCookieOptions({ expires: new Date(0), maxAge: undefined });
    res.cookie(cookieName, '', options);
    return res;
  }

  static clearAllAuthCookies(res) {
    this.clearCookie(res, 'accessToken');
    this.clearCookie(res, 'refreshToken');
    return res;
  }

  static getAccessTokenFromRequest(req) {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    return token;
  }

  static getRefreshTokenFromRequest(req) {
    if (req.cookies && req.cookies.refreshToken) {
      return req.cookies.refreshToken;
    }
    return undefined;
  }

  static sendTokensResponse(res, user, ResponseFormatter, statusCode = httpStatus.OK, message = 'İşlem başarılı') {
    const accessToken = TokenHelper.generateAccessToken(user);
    const refreshToken = TokenHelper.generateRefreshToken(user._id);

    this.setRefreshTokenCookie(res, refreshToken);

    return res.status(statusCode).json(
      ResponseFormatter.success(
        {
          user: user.toJSON(),
          accessToken,
        },
        message
      )
    );
  }
}

module.exports = CookieHelper;
