const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");

const errorHandler = require("./middleware/errorHandler");
const authRoutes = require("./routes/auth.routes");
const propertyRoutes = require("./routes/property.routes");
const leadRoutes = require("./routes/lead.routes");
const dashboardRoutes = require("./routes/dashboard.routes");

const app = express();

// ── Security Headers ─────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.options("*", cors());

// ── Rate Limiting ─────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
});
app.use("/api", limiter);

// Stricter limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many auth attempts, please try again later." },
});
app.use("/api/v1/auth", authLimiter);

// ── Body Parsers ──────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── NoSQL Injection Prevention ────────────────────────────────
app.use(mongoSanitize());

// ── Logging ───────────────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ── Health Check ──────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, message: "Server is healthy" });
});

// ── API Routes ────────────────────────────────────────────────
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/properties", propertyRoutes);
app.use("/api/v1/leads", leadRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

// ── 404 Handler ───────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ── Centralized Error Handler ─────────────────────────────────
app.use(errorHandler);

module.exports = app;
