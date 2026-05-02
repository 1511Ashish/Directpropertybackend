const cloudinary = require("../config/cloudinary");
const logger = require("../utils/logger");

/**
 * Delete a single image from Cloudinary by its public_id
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (err) {
    logger.error(`Cloudinary delete failed for ${publicId}: ${err.message}`);
    throw err;
  }
};

/**
 * Delete multiple images from Cloudinary
 */
const deleteImages = async (images) => {
  const deletePromises = images.map((img) => deleteImage(img.publicId));
  return Promise.allSettled(deletePromises);
};

module.exports = { deleteImage, deleteImages };
