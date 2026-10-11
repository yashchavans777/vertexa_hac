/**
 * ActionGate - Higher-Order Async Handler
 * src/utils/asyncHandler.js
 * 
 * Standard "Chai aur Code" production pattern:
 * Wraps asynchronous Express route handlers and controller functions,
 * catching rejected Promises and forwarding errors to the global error middleware.
 * Eliminates boilerplate try-catch blocks across all controllers.
 * 
 * @param {Function} requestHandler - Asynchronous Express middleware/controller function
 * @returns {Function} Express middleware that resolves the Promise or forwards error to next()
 */
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

module.exports = { asyncHandler };
