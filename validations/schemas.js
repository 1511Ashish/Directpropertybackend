const Joi = require("joi");

// ── Auth ──────────────────────────────────────────────────────
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(8).required().messages({
    "string.min": "Password must be at least 8 characters",
    "any.required": "Password is required",
  }),
});

const registerSchema = Joi.object({
  name: Joi.string().max(80).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid("admin", "super_admin").default("admin"),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

// ── Property ──────────────────────────────────────────────────
const propertyCreateSchema = Joi.object({
  title: Joi.string().max(200).required(),
  description: Joi.string().max(5000).required(),
  price: Joi.number().min(0).required(),
  location: Joi.object({
    address: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().optional(),
    pincode: Joi.string().optional(),
  }).required(),
  propertyType: Joi.string()
    .valid("flat", "villa", "plot", "house", "commercial", "office")
    .required(),
  status: Joi.string().valid("available", "sold").default("available"),
  amenities: Joi.array().items(Joi.string()).optional(),
  bedrooms: Joi.number().min(0).optional(),
  bathrooms: Joi.number().min(0).optional(),
  area: Joi.number().min(0).optional(),
  isFeatured: Joi.boolean().optional(),
});

const propertyUpdateSchema = propertyCreateSchema.fork(
  ["title", "description", "price", "location", "propertyType"],
  (schema) => schema.optional()
);

// ── Lead ──────────────────────────────────────────────────────
const leadCreateSchema = Joi.object({
  name: Joi.string().max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({ "string.pattern.base": "Please provide a valid 10-digit Indian phone number" }),
  message: Joi.string().max(1000).optional(),
  property: Joi.string().optional(), // MongoDB ObjectId string
  source: Joi.string().valid("website", "phone", "walk-in", "referral").default("website"),
});

const leadStatusUpdateSchema = Joi.object({
  status: Joi.string().valid("new", "contacted", "converted", "closed").required(),
});

module.exports = {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  propertyCreateSchema,
  propertyUpdateSchema,
  leadCreateSchema,
  leadStatusUpdateSchema,
};
