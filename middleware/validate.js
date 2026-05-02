const AppError = require("../utils/AppError");
const { deleteImages } = require("../services/cloudinary.service");

/**
 * Returns an Express middleware that validates req.body against the given Joi schema
 */
const validate = (schema) => async (req, _res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    if (req.files?.length) {
      await deleteImages(req.files.map((file) => ({ publicId: file.filename })));
    }

    const message = error.details.map((d) => d.message.replace(/"/g, "'")).join(", ");
    return next(new AppError(message, 422));
  }

  req.body = value; // Replace with sanitised/casted values
  next();
};

module.exports = validate;
