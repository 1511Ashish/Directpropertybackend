const Lead = require("../models/Lead.model");
const AppError = require("../utils/AppError");
const catchAsync = require("../middleware/catchAsync");
const { sendResponse } = require("../utils/apiResponse");

// ── Create Lead (public — from website) ───────────────────────
const createLead = catchAsync(async (req, res) => {
  const lead = await Lead.create(req.body);
  sendResponse(res, 201, "Enquiry submitted successfully", {
    id: lead._id,
    name: lead.name,
    createdAt: lead.createdAt,
  });
});

// ── Get All Leads (admin) ─────────────────────────────────────
const getLeads = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    search,
    sortBy = "createdAt",
    order = "desc",
  } = req.query;

  const query = {};
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  const allowedSortFields = ["createdAt", "name", "status", "source"];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const sortOrder = order === "asc" ? 1 : -1;
  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const skip = (pageNumber - 1) * limitNumber;

  const [leads, total] = await Promise.all([
    Lead.find(query)
      .populate("property", "title slug price")
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limitNumber)
      .lean(),
    Lead.countDocuments(query),
  ]);

  sendResponse(res, 200, "Leads fetched", {
    leads,
    pagination: {
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber) || 1,
    },
  });
});

// ── Get Single Lead ───────────────────────────────────────────
const getLead = catchAsync(async (req, res, next) => {
  const lead = await Lead.findById(req.params.id)
    .populate("property", "title slug price location")
    .lean();
  if (!lead) return next(new AppError("Lead not found.", 404));
  sendResponse(res, 200, "Lead fetched", lead);
});

// ── Update Lead Status ────────────────────────────────────────
const updateLeadStatus = catchAsync(async (req, res, next) => {
  const lead = await Lead.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true }
  );
  if (!lead) return next(new AppError("Lead not found.", 404));
  sendResponse(res, 200, "Lead status updated", lead);
});

// ── Delete Lead ───────────────────────────────────────────────
const deleteLead = catchAsync(async (req, res, next) => {
  const lead = await Lead.findByIdAndDelete(req.params.id);
  if (!lead) return next(new AppError("Lead not found.", 404));
  sendResponse(res, 200, "Lead deleted successfully");
});

module.exports = { createLead, getLeads, getLead, updateLeadStatus, deleteLead };
