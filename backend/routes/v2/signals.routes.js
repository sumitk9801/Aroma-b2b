const express = require("express");
const router  = express.Router();
const { getSignalHistory, getAdjustedMetrics, getUpcomingEvents, getWeatherImpact, getSeasonalInsights } = require("../../controllers/v2/signals.controller");
const { auth, checkShopContext } = require("../../middleware/authMiddleware");

/**
 * V2.4 External Signals Engine Routes
 * Base: /api/v2/signals
 */

// GET /api/v2/signals/history — Historical external signals for a shop
router.get("/history", auth, checkShopContext, getSignalHistory);

// GET /api/v2/signals/adjusted — Signal-adjusted daily metrics
router.get("/adjusted", auth, checkShopContext, getAdjustedMetrics);

// GET /api/v2/signals/upcoming — Upcoming high-impact events (no shop context needed)
router.get("/upcoming", auth, getUpcomingEvents);

// GET /api/v2/signals/weather — Weather impact analysis for a shop
router.get("/weather", auth, checkShopContext, getWeatherImpact);

// GET /api/v2/signals/seasonal — Seasonal planning insights (next 90 days)
router.get("/seasonal", auth, getSeasonalInsights);

module.exports = router;
