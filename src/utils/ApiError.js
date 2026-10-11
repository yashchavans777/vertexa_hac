/**
 * ActionGate - Standardized Operational Error Class
 * src/utils/ApiError.js
 * 
 * Standard "Chai aur Code" production pattern:
 * Centralized custom error object providing uniform structural contract
 * for client-facing and internal operational errors.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP Status code (4xx, 5xx)
   * @param {string} [message="Something went wrong"] - User-facing or debugging error message
   * @param {Array} [errors=[]] - Detailed validation or domain error items
   * @param {string} [stack=""] - Optional pre-existing stack trace string
   */
  constructor(
    statusCode,
    message = 'Something went wrong',
    errors = [],
    stack = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = { ApiError };
