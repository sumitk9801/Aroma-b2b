const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { dashboardSummarySchema } = require("../middleware/validationSchemas");
const {
    getSummary,
    getRecentSales,
    getTopProducts,
    getLowStock,
    getSalesChart
} = require("../controllers/dashboardController");

// All dashboard endpoints require valid auth headers and enforce multi-tenant shop isolation
router.get("/summary", auth, validate(dashboardSummarySchema), getSummary);
router.get("/recent-sales", auth, validate(dashboardSummarySchema), getRecentSales);
router.get("/top-products", auth, validate(dashboardSummarySchema), getTopProducts);
router.get("/low-stock", auth, validate(dashboardSummarySchema), getLowStock);
router.get("/sales-chart", auth, validate(dashboardSummarySchema), getSalesChart);

module.exports = router;
