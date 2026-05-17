const Admin = require("../models/Admin.model");
const AppError = require("../utils/AppError");
const catchAsync = require("../middleware/catchAsync");
const { sendResponse } = require("../utils/apiResponse");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/tokenUtils");

// ── Register (Super Admin only) ───────────────────────────────
const register = catchAsync(async (req, res, next) => {
  const { name, email, password, role } = req.body;
  const isBootstrapRegistration = req.isBootstrapRegistration === true;

  const existing = await Admin.findOne({ email });
  if (existing) return next(new AppError("An admin with this email already exists.", 400));

  const adminRole = isBootstrapRegistration ? "super_admin" : role;
  const admin = await Admin.create({ name, email, password, role: adminRole });

  sendResponse(
    res,
    201,
    isBootstrapRegistration
      ? "First admin registered successfully. Bootstrap is now disabled."
      : "Admin registered successfully",
    {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    }
  );
});

// ── Login ─────────────────────────────────────────────────────
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Explicitly select password field (it is select:false in schema)
  const admin = await Admin.findOne({ email }).select("+password");
  if (!admin || !(await admin.comparePassword(password))) {
    return next(new AppError("Invalid email or password.", 401));
  }

  if (!admin.isActive) {
    return next(new AppError("Your account has been deactivated. Contact support.", 403));
  }

  const payload = { id: admin._id, role: admin.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Persist refresh token (hashed storage is optional for this scope)
  admin.refreshToken = refreshToken;
  admin.lastLogin = new Date();
  await admin.save({ validateBeforeSave: false });

  sendResponse(res, 200, "Login successful", {
    accessToken,
    refreshToken,
    admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
  });
});

// ── Refresh Access Token ──────────────────────────────────────
const refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken: token } = req.body;
  if (!token) return next(new AppError("Refresh token is required.", 400));

  const decoded = verifyRefreshToken(token);

  const admin = await Admin.findById(decoded.id).select("+refreshToken");
  if (!admin || admin.refreshToken !== token) {
    return next(new AppError("Invalid or expired refresh token.", 401));
  }

  const payload = { id: admin._id, role: admin.role };
  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  admin.refreshToken = newRefreshToken;
  await admin.save({ validateBeforeSave: false });

  sendResponse(res, 200, "Token refreshed", {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });
});

// ── Logout ────────────────────────────────────────────────────
const logout = catchAsync(async (req, res) => {
  await Admin.findByIdAndUpdate(req.admin._id, { refreshToken: null });
  sendResponse(res, 200, "Logged out successfully");
});

// ── Get Current Admin Profile ─────────────────────────────────
const getMe = catchAsync(async (req, res) => {
  sendResponse(res, 200, "Profile fetched", {
    id: req.admin._id,
    name: req.admin.name,
    email: req.admin.email,
    role: req.admin.role,
    lastLogin: req.admin.lastLogin,
  });
});

// â”€â”€ Change Password â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const admin = await Admin.findById(req.admin._id).select("+password +refreshToken");
  if (!admin || !(await admin.comparePassword(currentPassword))) {
    return next(new AppError("Current password is incorrect.", 401));
  }

  admin.password = newPassword;
  admin.refreshToken = null;
  await admin.save();

  sendResponse(res, 200, "Password changed successfully. Please log in again.");
});

// â”€â”€ Update Current Admin Email â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const updateEmail = catchAsync(async (req, res, next) => {
  const { currentPassword, email } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  const admin = await Admin.findById(req.admin._id).select("+password");
  if (!admin || !(await admin.comparePassword(currentPassword))) {
    return next(new AppError("Current password is incorrect.", 401));
  }

  const existing = await Admin.findOne({ email: normalizedEmail, _id: { $ne: admin._id } });
  if (existing) return next(new AppError("An admin with this email already exists.", 400));

  admin.email = normalizedEmail;
  await admin.save();

  sendResponse(res, 200, "Email updated successfully", {
    id: admin._id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  });
});

module.exports = { register, login, refreshToken, logout, getMe, changePassword, updateEmail };
