/**
 * Global Error Handler Middleware
 * Handles all application errors and returns structured JSON responses
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Custom Application Error Class
 */
export class AppError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Error code for client reference
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Custom validation error class
 */
export class ValidationError extends AppError {
  /**
   * @param {string} message - Error message
   * @param {Object} details - Additional validation details
   */
  constructor(message, details = {}) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

/**
 * Custom not found error class
 */
export class NotFoundError extends AppError {
  /**
   * @param {string} resource - Resource that was not found
   */
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

/**
 * Custom authentication error class
 */
export class AuthenticationError extends AppError {
  /**
   * @param {string} message - Error message
   */
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

/**
 * Global error handler middleware
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const errorHandler = (err, req, res, next) => {
  const errorId = uuidv4();
  const timestamp = new Date().toISOString();

  // Default error properties
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details = null;

  // Handle custom AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details || null;
  }

  // Handle validation errors from request validation
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = err.message;
  }

  // Handle Axios/Network errors
  else if (err.response) {
    // Axios error with response
    statusCode = err.response.status || 500;
    code = err.response.status === 429 ? 'RATE_LIMITED' : 'EXTERNAL_SERVICE_ERROR';
    message =
      err.response.data?.error?.message ||
      err.response.statusText ||
      'External service error';
  } else if (err.request && !err.response) {
    // Axios error without response (network error)
    statusCode = 503;
    code = 'SERVICE_UNAVAILABLE';
    message = 'Failed to connect to external service';
  }

  // Handle Multer file upload errors
  else if (err.name === 'MulterError') {
    statusCode = 400;
    code = 'FILE_UPLOAD_ERROR';
    message = getMulterErrorMessage(err);
  }

  // Log error with context
  logError(err, {
    errorId,
    statusCode,
    code,
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  // Send error response
  res.status(statusCode).json({
    success: false,
    errorId,
    timestamp,
    code,
    message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      originalError: err.message,
    }),
  });
};

/**
 * Handles async route handlers with automatic error catching
 * @param {Function} handler - Async route handler function
 * @returns {Function} Wrapped handler with error catching
 */
export const asyncHandler = (handler) => {
  return (req, res, next) => {
    return Promise.resolve(handler(req, res, next)).catch(next);
  };
};

/**
 * Gets human-readable error message from Multer error
 * @param {Error} err - Multer error object
 * @returns {string} Error message
 */
const getMulterErrorMessage = (err) => {
  const messages = {
    LIMIT_PART_COUNT: 'Too many form parts',
    LIMIT_FILE_SIZE: 'File size exceeds maximum allowed size',
    LIMIT_FILE_COUNT: 'Too many files',
    LIMIT_FIELD_KEY: 'Field key too long',
    LIMIT_FIELD_VALUE: 'Field value too long',
    LIMIT_FIELD_COUNT: 'Too many fields',
    LIMIT_UNEXPECTED_FILE: 'Unexpected file field',
    MISSING_FIELD_NAME: 'Missing field name',
  };

  return messages[err.code] || 'File upload error';
};

/**
 * Logs error with context information
 * @param {Error} error - The error object
 * @param {Object} context - Additional context
 */
const logError = (error, context = {}) => {
  const {
    errorId,
    statusCode,
    code,
    method,
    path,
    ip,
  } = context;

  const logEntry = {
    timestamp: new Date().toISOString(),
    errorId,
    level: statusCode >= 500 ? 'error' : 'warn',
    statusCode,
    code,
    message: error.message,
    method,
    path,
    ip,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  };

  if (statusCode >= 500) {
    console.error('[ERROR]', JSON.stringify(logEntry, null, 2));
  } else {
    console.warn('[WARN]', JSON.stringify(logEntry, null, 2));
  }
};

/**
 * 404 handler middleware - must be placed last
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const notFoundHandler = (req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.path}`));
};
