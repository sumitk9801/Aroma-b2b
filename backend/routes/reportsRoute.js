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
    getFastMovingProducts,
    getSalesByDateRange,
    getMyTransactions,
    getProductOrderFrequency,
    getTopCustomers,
    getInventoryTurnover,
    getStockRestoredSummary,
    getMonthlyComparison
} = require("../controllers/reportController");

// ─── Existing ADMIN-only reports ────────────────────────────────────────────
router.get("/sales-summary", auth, checkShopContext, allowRoles("ADMIN"), validate(salesSummaryReportSchema), getSalesSummary);
router.get("/purchase-summary", auth, checkShopContext, allowRoles("ADMIN"), validate(reportFilterSchema), getPurchaseSummary);
router.get("/profit-summary", auth, checkShopContext, allowRoles("ADMIN"), validate(reportFilterSchema), getProfitSummary);
router.get("/stock-valuation", auth, checkShopContext, allowRoles("ADMIN"), validate(reportFilterSchema), getStockValuation);
router.get("/dead-stock", auth, checkShopContext, allowRoles("ADMIN"), validate(reportFilterSchema), getDeadStock);
router.get("/fast-moving-products", auth, checkShopContext, allowRoles("ADMIN"), validate(reportFilterSchema), getFastMovingProducts);

// ─── Inventory KPIs — ADMIN only ─────────────────────────────────────────────
router.get("/inventory-turnover", auth, checkShopContext, allowRoles("ADMIN"), getInventoryTurnover);
router.get("/monthly-comparison", auth, checkShopContext, allowRoles("ADMIN"), getMonthlyComparison);

// ─── Manager + Admin reports ─────────────────────────────────────────────────
router.get("/sales-by-date", auth, checkShopContext, allowRoles("ADMIN", "MANAGER", "CASHIER"), getSalesByDateRange);
router.get("/stock-restored", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), getStockRestoredSummary);
router.get("/product-order-frequency", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), getProductOrderFrequency);
router.get("/top-customers", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), getTopCustomers);

// ─── All roles — each user sees ONLY their own data ──────────────────────────
router.get("/my-transactions", auth, getMyTransactions);

module.exports = router;
