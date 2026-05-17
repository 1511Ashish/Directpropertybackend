const mongoose = require("mongoose");
const slugify = require("slugify");

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true }, // Cloudinary public_id for deletion
  },
  { _id: false }
);

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Property title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
      index: true,
    },
    location: {
      address: { type: String, required: [true, "Address is required"], trim: true },
      city: { type: String, required: [true, "City is required"], trim: true, index: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
    },
    propertyType: {
      type: String,
      required: [true, "Property type is required"],
      enum: ["flat", "villa", "plot", "house", "commercial", "office"],
      index: true,
    },
    status: {
      type: String,
      enum: ["available", "sold"],
      default: "available",
      index: true,
    },
    images: [imageSchema],
    amenities: [
      {
        type: String,
        trim: true,
      },
    ],
    bedrooms: { type: Number, min: 0 },
    bathrooms: { type: Number, min: 0 },
    area: { type: Number, min: 0 }, // square feet
    constructionSize: { type: Number, min: 0 }, // square feet
    kitchen: { type: Number, min: 0 },
    hall: { type: Number, min: 0 },
    tower: { type: String, trim: true },
    otherRooms: [
      {
        type: String,
        trim: true,
      },
    ],
    facing: {
      type: String,
      enum: ["North", "East", "West", "South"],
    },
    isFeatured: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false, index: true }, // Soft delete
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-generate slug from title before saving
propertySchema.pre("save", async function (next) {
  if (!this.isModified("title")) return next();

  let baseSlug = slugify(this.title, { lower: true, strict: true });
  let slug = baseSlug;
  let count = 1;

  // Ensure slug uniqueness
  while (await mongoose.model("Property").findOne({ slug, _id: { $ne: this._id } })) {
    slug = `${baseSlug}-${count++}`;
  }

  this.slug = slug;
  next();
});

// Exclude soft-deleted docs from all queries by default
propertySchema.pre(/^find/, function (next) {
  if (!this.getOptions().includedeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

module.exports = mongoose.model("Property", propertySchema);
