const logger = require("../utils/logger");

/**
 * Transform Mongoose/JWT errors into user-friendly AppErrors
 */
const handleCastError = (err) => ({
  statusCode: 400,
  message: `Invalid ${err.path}: ${err.value}`,
});

const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return { statusCode: 400, message: `${field} already exists. Please use a different value.` };
};

const handleValidationError = (err) => ({
  statusCode: 400,
  message: Object.values(err.errors)
    .map((e) => e.message)
    .join(", "),
});

const handleJWTError = () => ({
  statusCode: 401,
  message: "Invalid token. Please log in again.",
});

const handleJWTExpiredError = () => ({
  statusCode: 401,
  message: "Your token has expired. Please log in again.",
});

// ── Main Error Handler ────────────────────────────────────────
const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Mongoose / JWT specific errors
  if (err.name === "CastError") ({ statusCode, message } = handleCastError(err));
  if (err.code === 11000) ({ statusCode, message } = handleDuplicateKeyError(err));
  if (err.name === "ValidationError") ({ statusCode, message } = handleValidationError(err));
  if (err.name === "JsonWebTokenError") ({ statusCode, message } = handleJWTError());
  if (err.name === "TokenExpiredError") ({ statusCode, message } = handleJWTExpiredError());

  // Log server errors
  if (statusCode >= 500) {
    logger.error(`${statusCode} - ${message} - ${err.stack}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" &&
      process.env.EXPOSE_ERROR_STACK === "true" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
