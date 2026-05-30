const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { salesSummaryReportSchema, reportFilterSchema } = require("../middleware/validationSchemas");
const {
    getSalesSummary,
    getPurchaseSummary,
    getProfitSummary,
    getStockValuation,
    getDeadStock,
    getFastMovingProducts
} = require("../controllers/reportController");

// Enforce standard authentication token validation on all reporting intelligence queries
router.get("/sales-summary", auth, validate(salesSummaryReportSchema), getSalesSummary);
router.get("/purchase-summary", auth, validate(reportFilterSchema), getPurchaseSummary);
router.get("/profit-summary", auth, validate(reportFilterSchema), getProfitSummary);
router.get("/stock-valuation", auth, validate(reportFilterSchema), getStockValuation);
router.get("/dead-stock", auth, validate(reportFilterSchema), getDeadStock);
router.get("/fast-moving-products", auth, validate(reportFilterSchema), getFastMovingProducts);

module.exports = router;
