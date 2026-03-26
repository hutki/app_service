const multer = require('multer');

const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Internal server error';

  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found';
  }

  if (err.code === 11000) {
    statusCode = 400;
    const duplicateField = Object.keys(err.keyValue || {})[0];
    message = duplicateField
      ? `${duplicateField} already exists`
      : 'Duplicate value error';
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((validationError) => validationError.message)
      .join(', ');
  }

  if (err instanceof multer.MulterError) {
    statusCode = 400;
    message = err.code === 'LIMIT_FILE_SIZE'
      ? 'File is too large. Maximum allowed size is 10MB'
      : err.message;
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};

module.exports = {
  notFound,
  errorHandler
};
