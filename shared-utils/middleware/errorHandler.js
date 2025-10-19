const { httpStatus } = require('../constants');
const { ResponseFormatter } = require('../helpers');

class ErrorHandler {
  static handle(err, req, res, next) {


    
    console.error(err); 

    // Joi validation hatası
    if (err.isJoi) {
      const errors = err.details.map(d => ({ field: d.path.join('.'), message: d.message }));
      return res.status(httpStatus.BAD_REQUEST).json(
        ResponseFormatter.error('Validation error', httpStatus.BAD_REQUEST, errors)
      );
    }

    // Genel sunucu hatası
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
      ResponseFormatter.error('Internal Server Error', httpStatus.INTERNAL_SERVER_ERROR)
    );
  }

  static notFound(req, res) {
    res.status(httpStatus.NOT_FOUND).json(
      ResponseFormatter.error(`Route not found: ${req.originalUrl}`, httpStatus.NOT_FOUND)
    );
  }
}

module.exports = ErrorHandler;