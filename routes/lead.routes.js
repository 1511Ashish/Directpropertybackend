const router = require("express").Router();
const { createLead, getLeads, getLead, updateLeadStatus, deleteLead } = require("../controllers/lead.controller");
const { protect } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate");
const { leadCreateSchema, leadStatusUpdateSchema } = require("../validations/schemas");

// Public — website visitors submit enquiries
router.post("/", validate(leadCreateSchema), createLead);

// Protected — admin only
router.use(protect);
router.get("/", getLeads);
router.get("/:id", getLead);
router.patch("/:id/status", validate(leadStatusUpdateSchema), updateLeadStatus);
router.delete("/:id", deleteLead);

module.exports = router;
