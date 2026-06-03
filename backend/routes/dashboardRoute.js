const express = require("express");
const router = express.Router();
const { auth, checkShopContext, allowRoles } = require("../middleware/authMiddleware");
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
router.get("/summary", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), validate(dashboardSummarySchema), getSummary);
router.get("/recent-sales", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), validate(dashboardSummarySchema), getRecentSales);
router.get("/top-products", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), validate(dashboardSummarySchema), getTopProducts);
router.get("/low-stock", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), validate(dashboardSummarySchema), getLowStock);
router.get("/sales-chart", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), validate(dashboardSummarySchema), getSalesChart);

module.exports = router;
