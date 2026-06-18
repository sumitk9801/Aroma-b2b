const express = require("express");
const router  = express.Router();
const { getTrendingSummary, getRisingProducts, getDecliningProducts, getOpportunities, triggerTrendDetection } = require("../../controllers/v2/trends.controller");
const { auth, checkShopContext, allowRoles } = require("../../middleware/authMiddleware");

/**
 * V2.5 Trend Detection Engine Routes
 * Base: /api/v2/trends
 */

// GET /api/v2/trends/summary — Full trend label summary for a shop
router.get("/summary", auth, checkShopContext, getTrendingSummary);

// GET /api/v2/trends/rising — Products trending up or growing
router.get("/rising", auth, checkShopContext, getRisingProducts);

// GET /api/v2/trends/declining — Products declining or at risk
router.get("/declining", auth, checkShopContext, getDecliningProducts);

// GET /api/v2/trends/opportunities — High opportunity scored products
router.get("/opportunities", auth, checkShopContext, getOpportunities);

// POST /api/v2/trends/trigger — Manual trend detection trigger (admin only)
router.post("/trigger", auth, checkShopContext, allowRoles("ADMIN", "MANAGER"), triggerTrendDetection);

module.exports = router;
