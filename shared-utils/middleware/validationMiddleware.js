const logger = require('../logger');
const { httpStatus } = require('../constants');
const { ResponseFormatter } = require('../helpers');

class ValidationMiddleware {
  static validateRequest(schema) {
    return (req, res, next) => {
      try {
        const validationOptions = {
          abortEarly: false, 
          allowUnknown: true, 
          stripUnknown: true, 
        };

        if (schema.body) {
          const { error, value } = schema.body.validate(req.body, validationOptions);
          if (error) {
            const errors = error.details.map((detail) => ({
              field: detail.path.join('.'),
              message: detail.message,
            }));
            logger.warn('Validation error (body):', { url: req.originalUrl, errors }); 
            return res
              .status(httpStatus.BAD_REQUEST)
              .json(ResponseFormatter.error('Validation error', httpStatus.BAD_REQUEST, errors));
          }
          req.body = value; 
        }

        if (schema.params) {
          const { error, value } = schema.params.validate(req.params, validationOptions);
          if (error) {
            const errors = error.details.map((detail) => ({
              field: detail.path.join('.'),
              message: detail.message,
            }));
            logger.warn('Validation error (params):', { url: req.originalUrl, errors });
            return res
              .status(httpStatus.BAD_REQUEST)
              .json(ResponseFormatter.error('Invalid URL parameters', httpStatus.BAD_REQUEST, errors));
          }
          req.params = value;
        }

        if (schema.query) {
          const { error, value } = schema.query.validate(req.query, validationOptions);
          if (error) {
            const errors = error.details.map((detail) => ({
              field: detail.path.join('.'),
              message: detail.message,
            }));
            logger.warn('Validation error (query):', { url: req.originalUrl, errors });
            return res
              .status(httpStatus.BAD_REQUEST)
              .json(ResponseFormatter.error('Invalid query parameters', httpStatus.BAD_REQUEST, errors));
          }
          req.query = value;
        }

        next();
      } catch (err) {
        logger.error('Unexpected error in validation middleware:', err);
        return res
          .status(httpStatus.INTERNAL_SERVER_ERROR)
          .json(ResponseFormatter.error('Internal Server Error during validation', httpStatus.INTERNAL_SERVER_ERROR));
      }
    };
  }

  static validateObjectId(paramName = 'id') {
    return (req, res, next) => {
      const id = req.params[paramName];

      const objectIdPattern = /^[0-9a-fA-F]{24}$/;

      if (!id || !objectIdPattern.test(id)) { 
        logger.warn(`Invalid ObjectId format for param '${paramName}': ${id}`);
        return res
          .status(httpStatus.BAD_REQUEST)
          .json(ResponseFormatter.error(`Invalid ${paramName} format`, httpStatus.BAD_REQUEST));
      }

      
      next();
    };
  }
}

module.exports = ValidationMiddleware;