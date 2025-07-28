// middleware/async.js

// Try-catch bloklarını her controller'da tekrar yazmamak için kullanılan yardımcı fonksiyon
const asyncHandler = fn => (req, res, next) =>
    Promise
      .resolve(fn(req, res, next))
      .catch(next);
  
  module.exports = asyncHandler;