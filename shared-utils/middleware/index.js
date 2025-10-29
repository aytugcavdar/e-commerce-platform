module.exports = {
  asyncHandler: require('./asyncHandler'),
  ErrorHandler: require('./errorHandler'),
  authMiddleware: require('./authMiddleware'),
  validationMiddleware: require('./validationMiddleware'),
  rateLimitMiddleware: require('./rateLimitMiddleware'),
  securityMiddleware: require('./securityMiddleware'),
  
  // Alternative exports (camelCase)
  AuthMiddleware: require('./authMiddleware'),
  ValidationMiddleware: require('./validationMiddleware'),
  RateLimitMiddleware: require('./rateLimitMiddleware'),
  SecurityMiddleware: require('./securityMiddleware'),
};