const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^[6-9]\d{9}$/, "Please provide a valid 10-digit Indian phone number"],
    },
    message: {
      type: String,
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      default: null, // Can be a general enquiry
    },
    status: {
      type: String,
      enum: ["new", "contacted", "converted", "closed"],
      default: "new",
    },
    source: {
      type: String,
      enum: ["website", "phone", "walk-in", "referral"],
      default: "website",
    },
  },
  { timestamps: true }
);

// Index for faster sorting by newest
leadSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Lead", leadSchema);
