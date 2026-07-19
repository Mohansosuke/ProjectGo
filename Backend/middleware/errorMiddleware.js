const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error.errors || [], err.stack);
  }

  const response = {
    statusCode: error.statusCode,
    message: error.message,
    success: error.success,
    errors: error.errors,
    ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {})
  };

  return res.status(error.statusCode).json(response);
};

module.exports = errorHandler;
