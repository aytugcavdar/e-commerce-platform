const {httpStatus} = require('../constants');

class ResponseFormatter {
    static success(data = null,message = 'Success', statusCode = httpStatus.OK) {
        return {
            status: 'success',
            message,
            data,
            statusCode
        };
    }
    static error(message = 'Error', statusCode = httpStatus.INTERNAL_SERVER_ERROR, errors = []) {
        return {
            status: 'error',
            message,
            errors,
            statusCode
        };
    }

    static notFound(message = 'Not Found', statusCode = httpStatus.NOT_FOUND) {
        return {
            status: 'error',
            message,
            statusCode
        };
    }

    

}