/**
 * ActionGate - Centralized Global Error Handling Middleware
 * src/middlewares/error.middleware.js
 * 
 * Production Pattern:
 * Intercepts all unhandled errors, normalizes Mongoose & native errors
 * into standardized ApiError instances, and returns uniform JSON responses.
 */
const mongoose = require('mongoose');
const { ApiError } = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
  let error = err;

  // If the error is not already an instance of our operational ApiError, normalize it
  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode ||
      (error instanceof mongoose.Error ? 400 : 500);

    const message = error.message || "Internal Server Error";
    error = new ApiError(
      statusCode,
      message,
      error?.errors || [],
      err.stack
    );
  }

  // Handle Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = new ApiError(409, `Duplicate value entered for unique field: ${field}`, [
      { field, value: err.keyValue ? err.keyValue[field] : undefined }
    ]);
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    error = new ApiError(400, `Resource not found with invalid ID: ${err.value}`);
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map((val) => val.message);
    error = new ApiError(400, 'Database Schema Validation Failed', messages);
  }

  // Build uniform response envelope
  const response = {
    statusCode: error.statusCode,
    success: false,
    message: error.message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {})
  };

  // Securely log server-side 5xx critical faults
  if (error.statusCode >= 500) {
    console.error(`[ActionGate 5xx Critical Error] ${req.method} ${req.originalUrl}:`, error);
  }

  return res.status(error.statusCode).json(response);
};

module.exports = { errorHandler };
