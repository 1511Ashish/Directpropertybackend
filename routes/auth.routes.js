const router = require("express").Router();
const Admin = require("../models/Admin.model");
const { register, login, refreshToken, logout, getMe } = require("../controllers/auth.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const catchAsync = require("../middleware/catchAsync");
const validate = require("../middleware/validate");
const { loginSchema, registerSchema, refreshTokenSchema } = require("../validations/schemas");

const bootstrapOrProtect = catchAsync(async (req, res, next) => {
  const adminCount = await Admin.countDocuments();

  if (adminCount === 0) {
    req.isBootstrapRegistration = true;
    return next();
  }

  return protect(req, res, next);
});

const bootstrapOrSuperAdmin = (req, res, next) => {
  if (req.isBootstrapRegistration) {
    return next();
  }

  return restrictTo("super_admin")(req, res, next);
};

// Public
router.post("/login", validate(loginSchema), login);
router.post("/refresh-token", validate(refreshTokenSchema), refreshToken);
router.post(
  "/register",
  bootstrapOrProtect,
  bootstrapOrSuperAdmin,
  validate(registerSchema),
  register
);

// Protected
router.use(protect);
router.get("/me", getMe);
router.post("/logout", logout);

module.exports = router;
