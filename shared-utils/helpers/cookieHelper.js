// shared-utils/helpers/cookieHelper.js

const { httpStatus } = require('../constants');
const TokenHelper = require('./tokenHelper');
const ResponseFormatter = require('./responseFormatter');

class CookieHelper {
  static getCookieOptions(customOptions = {}) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    const defaultOptions = {
      httpOnly: true,                   
      secure: true,             
      sameSite: 'none',
      path: '/',                        
      domain: undefined,                 
    };
    
    return { ...defaultOptions, ...customOptions };
  }

  static setTokenCookie(res, token, options = {}) {
    const accessExpireMs = parseInt(process.env.JWT_ACCESS_EXPIRE_MS || '900000'); // 15dk
    const cookieOptions = this.getCookieOptions({ 
      maxAge: accessExpireMs, 
      ...options 
    });
    
    res.cookie('accessToken', token, cookieOptions);
    
    // ✅ Debug: Cookie'nin set edildiğini logla
    console.log('🍪 Access Token Cookie Set:', {
      name: 'accessToken',
      maxAge: accessExpireMs,
      options: cookieOptions
    });
    
    return res;
  }

  static setRefreshTokenCookie(res, refreshToken, options = {}) {
    const refreshExpireMs = parseInt(process.env.JWT_REFRESH_EXPIRE_MS || '604800000'); // 7 gün
    const cookieOptions = this.getCookieOptions({ 
      maxAge: refreshExpireMs, 
      ...options 
    });
    
    res.cookie('refreshToken', refreshToken, cookieOptions);
    
    // ✅ Debug: Cookie'nin set edildiğini logla
    console.log('🍪 Refresh Token Cookie Set:', {
      name: 'refreshToken',
      maxAge: refreshExpireMs,
      options: cookieOptions
    });
    
    return res;
  }

  static clearCookie(res, cookieName) {
    const options = this.getCookieOptions({ 
      expires: new Date(0), 
      maxAge: undefined 
    });
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
    
    // 1. Authorization header'dan al
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // 2. Cookie'den al
    else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    
    // ✅ Debug: Token'ın alındığını logla
    if (token) {
      console.log('🔑 Access Token Found:', token.substring(0, 20) + '...');
    } else {
      console.warn('⚠️ No Access Token Found in Request');
    }
    
    return token;
  }

  static getRefreshTokenFromRequest(req) {
    const token = req.cookies?.refreshToken;
    
    // ✅ Debug: Token'ın alındığını logla
    if (token) {
      console.log('🔄 Refresh Token Found:', token.substring(0, 20) + '...');
    } else {
      console.warn('⚠️ No Refresh Token Found in Request');
    }
    
    return token;
  }

  static sendTokensResponse(res, user, message = 'İşlem başarılı', statusCode = httpStatus.OK) {
    const accessToken = TokenHelper.generateAccessToken(user);
    const refreshToken = TokenHelper.generateRefreshToken(user._id);

    this.setTokenCookie(res, accessToken);
    this.setRefreshTokenCookie(res, refreshToken);

    // ✅ Debug: Response header'ları logla
    console.log('📤 Response Headers:', {
      'Set-Cookie': res.getHeader('Set-Cookie')
    });

    return res.status(statusCode).json(
      ResponseFormatter.success(
        {
          user: user.toJSON(),
        },
        message
      )
    );
  }
}

module.exports = CookieHelper;