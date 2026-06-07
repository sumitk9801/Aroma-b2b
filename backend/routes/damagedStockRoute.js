const express = require("express");
const router = express.Router();
const { auth, checkShopContext, allowRoles } = require("../middleware/authMiddleware");
const {
    reportDamage, getAllDamageReports, getDamageSummary, getDamageByProduct
} = require("../controllers/damagedStockController");

// Report a damage event — Manager and Admin can report damage
router.post("/", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), reportDamage);

// View damage reports — Manager and Admin
router.get("/", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), getAllDamageReports);

// Damage summary (analytics) — Manager and Admin
router.get("/summary", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), getDamageSummary);

// Damage history for a specific product
router.get("/product/:productId", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), getDamageByProduct);

module.exports = router;
