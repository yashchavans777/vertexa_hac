/**
 * ActionGate - Standardized API Response Class
 * src/utils/ApiResponse.js
 * 
 * Standard "Chai aur Code" production pattern:
 * Uniform response wrapper ensuring predictable payload schemas across all endpoints:
 * { statusCode, data, message, success }
 */
class ApiResponse {
  /**
   * @param {number} statusCode - HTTP status code (typically 200, 201)
   * @param {*} data - Serialized payload returned to the caller
   * @param {string} [message="Success"] - Operation description or status text
   */
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

module.exports = { ApiResponse };
