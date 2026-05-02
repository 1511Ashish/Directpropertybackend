const Property = require("../models/Property.model");
const AppError = require("../utils/AppError");
const catchAsync = require("../middleware/catchAsync");
const { sendResponse } = require("../utils/apiResponse");
const { deleteImages, deleteImage } = require("../services/cloudinary.service");

const buildPropertyQuery = ({ search, propertyType, status, minPrice, maxPrice, city }) => {
  const query = { isDeleted: false };

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { "location.address": { $regex: search, $options: "i" } },
      { "location.city": { $regex: search, $options: "i" } },
    ];
  }

  if (propertyType) query.propertyType = propertyType;
  if (status) query.status = status;
  if (city) query["location.city"] = { $regex: city, $options: "i" };

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  return query;
};

// ── Create Property ───────────────────────────────────────────
const createProperty = catchAsync(async (req, res) => {
  const propertyData = { ...req.body, createdBy: req.admin._id };

  // Attach uploaded images (set by Multer/Cloudinary middleware)
  if (req.files?.length) {
    propertyData.images = req.files.map((file) => ({
      url: file.path,
      publicId: file.filename,
    }));
  }

  const property = await Property.create(propertyData);
  sendResponse(res, 201, "Property created successfully", property);
});

// ── Get All Properties (paginated, filtered, searched) ────────
const getProperties = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    propertyType,
    status,
    minPrice,
    maxPrice,
    city,
    sortBy = "createdAt",
    order = "desc",
  } = req.query;

  const query = buildPropertyQuery({ search, propertyType, status, minPrice, maxPrice, city });

  const allowedSortFields = ["price", "createdAt", "title"];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const sortOrder = order === "asc" ? 1 : -1;

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const skip = (pageNumber - 1) * limitNumber;

  const [properties, total] = await Promise.all([
    Property.find(query)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limitNumber)
      .lean(),
    Property.countDocuments(query),
  ]);

  sendResponse(res, 200, "Properties fetched", {
    properties,
    pagination: {
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber) || 1,
    },
  });
});

// ── Get Single Property ───────────────────────────────────────
const getProperty = catchAsync(async (req, res, next) => {
  // Support both ID and slug lookup
  const { id } = req.params;
  const filter = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slug: id };

  const property = await Property.findOne(filter).lean();
  if (!property) return next(new AppError("Property not found.", 404));

  sendResponse(res, 200, "Property fetched", property);
});

// ── Update Property ───────────────────────────────────────────
const updateProperty = catchAsync(async (req, res, next) => {
  const property = await Property.findOne({ _id: req.params.id, isDeleted: false });
  if (!property) return next(new AppError("Property not found.", 404));

  Object.assign(property, req.body);

  if (req.files?.length) {
    const newImages = req.files.map((file) => ({
      url: file.path,
      publicId: file.filename,
    }));
    property.images = [...property.images, ...newImages];
  }

  await property.save();

  sendResponse(res, 200, "Property updated successfully", property);
});

// ── Delete Single Image from a Property ───────────────────────
const deletePropertyImage = catchAsync(async (req, res, next) => {
  const { id, publicId } = req.params;

  const property = await Property.findOne({ _id: id, isDeleted: false });
  if (!property) return next(new AppError("Property not found.", 404));

  const imageExists = property.images.find((img) => img.publicId === publicId);
  if (!imageExists) return next(new AppError("Image not found on this property.", 404));

  await deleteImage(publicId);

  property.images = property.images.filter((img) => img.publicId !== publicId);
  await property.save();

  sendResponse(res, 200, "Image deleted successfully", property);
});

// ── Soft Delete Property ──────────────────────────────────────
const deleteProperty = catchAsync(async (req, res, next) => {
  const property = await Property.findOne({ _id: req.params.id, isDeleted: false });
  if (!property) return next(new AppError("Property not found.", 404));

  // Delete all Cloudinary images
  if (property.images?.length) {
    await deleteImages(property.images);
  }

  property.isDeleted = true;
  await property.save();

  sendResponse(res, 200, "Property deleted successfully");
});

module.exports = {
  createProperty,
  getProperties,
  getProperty,
  updateProperty,
  deleteProperty,
  deletePropertyImage,
};
