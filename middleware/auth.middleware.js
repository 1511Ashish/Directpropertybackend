const Admin = require("../models/Admin.model");
const AppError = require("../utils/AppError");
const { verifyAccessToken } = require("../utils/tokenUtils");
const catchAsync = require("./catchAsync");

/**
 * Protect route — verifies JWT and attaches admin to req
 */
const protect = catchAsync(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  let token;

  if (typeof authHeader === "string") {
    const [scheme, credentials] = authHeader.trim().split(/\s+/);
    if (scheme === "Bearer" && credentials) {
      token = credentials;
    }
  }

  if (!token) {
    return next(new AppError("You are not logged in. Please log in to continue.", 401));
  }

  // Verify token
  const decoded = verifyAccessToken(token);

  // Check admin still exists
  const admin = await Admin.findById(decoded.id);
  if (!admin || !admin.isActive) {
    return next(new AppError("The account belonging to this token no longer exists.", 401));
  }

  req.admin = admin;
  next();
});

/**
 * Restrict to specified roles
 */
const restrictTo = (...roles) => {
  return (req, _res, next) => {
    if (!roles.includes(req.admin.role)) {
      return next(new AppError("You do not have permission to perform this action.", 403));
    }
    next();
  };
};

module.exports = { protect, restrictTo };
