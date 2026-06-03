const express = require("express");
const router = express.Router();
const { auth, checkShopContext, allowRoles } = require("../middleware/authMiddleware");
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
router.get("/sales-summary", auth, checkShopContext, allowRoles("ADMIN"), validate(salesSummaryReportSchema), getSalesSummary);
router.get("/purchase-summary", auth, checkShopContext, allowRoles("ADMIN"), validate(reportFilterSchema), getPurchaseSummary);
router.get("/profit-summary", auth, checkShopContext, allowRoles("ADMIN"), validate(reportFilterSchema), getProfitSummary);
router.get("/stock-valuation", auth, checkShopContext, allowRoles("ADMIN"), validate(reportFilterSchema), getStockValuation);
router.get("/dead-stock", auth, checkShopContext, allowRoles("ADMIN"), validate(reportFilterSchema), getDeadStock);
router.get("/fast-moving-products", auth, checkShopContext, allowRoles("ADMIN"), validate(reportFilterSchema), getFastMovingProducts);

module.exports = router;
