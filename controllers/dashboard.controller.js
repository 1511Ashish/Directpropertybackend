const Property = require("../models/Property.model");
const Lead = require("../models/Lead.model");
const catchAsync = require("../middleware/catchAsync");
const { sendResponse } = require("../utils/apiResponse");

const getDashboard = catchAsync(async (req, res) => {
  const [
    totalProperties,
    availableProperties,
    soldProperties,
    featuredProperties,
    totalLeads,
    newLeads,
    propertyTypeStats,
    recentProperties,
    recentLeads,
    leadStatusStats,
  ] = await Promise.all([
    // Property counts
    Property.countDocuments({ isDeleted: false }),
    Property.countDocuments({ status: "available", isDeleted: false }),
    Property.countDocuments({ status: "sold", isDeleted: false }),
    Property.countDocuments({ isFeatured: true, isDeleted: false }),

    // Lead counts
    Lead.countDocuments(),
    Lead.countDocuments({ status: "new" }),

    // Properties grouped by type
    Property.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: "$propertyType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // 5 most recently added properties
    Property.find({ isDeleted: false })
      .select("title price status propertyType location createdAt slug")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),

    // 5 most recent leads
    Lead.find()
      .select("name email phone status createdAt")
      .populate("property", "title")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),

    // Leads grouped by status
    Lead.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  sendResponse(res, 200, "Dashboard data fetched", {
    properties: {
      total: totalProperties,
      available: availableProperties,
      sold: soldProperties,
      featured: featuredProperties,
      byType: propertyTypeStats.map((t) => ({ type: t._id, count: t.count })),
    },
    leads: {
      total: totalLeads,
      new: newLeads,
      byStatus: leadStatusStats.map((s) => ({ status: s._id, count: s.count })),
    },
    recentActivity: {
      properties: recentProperties,
      leads: recentLeads,
    },
  });
});

module.exports = { getDashboard };
