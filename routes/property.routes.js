const router = require("express").Router();
const {
  createProperty,
  getProperties,
  getProperty,
  updateProperty,
  deleteProperty,
  deletePropertyImage,
} = require("../controllers/property.controller");
const { protect } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");
const validate = require("../middleware/validate");
const { propertyCreateSchema, propertyUpdateSchema } = require("../validations/schemas");

// Public — anyone can browse listings
router.get("/", getProperties);
router.get("/:id", getProperty); // supports both ObjectId and slug

// Protected — admin only
router.use(protect);
router.post("/", upload.array("images", 10), validate(propertyCreateSchema), createProperty);
router.put("/:id", upload.array("images", 10), validate(propertyUpdateSchema), updateProperty);
router.delete("/:id", deleteProperty);
router.delete("/:id/images/:publicId", deletePropertyImage);

module.exports = router;
