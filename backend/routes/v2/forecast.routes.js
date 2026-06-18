const express = require("express");
const router  = express.Router();
const { getShortForecast, getMediumForecast, getProductForecast, getReorderMetrics, getStockRisk } = require("../../controllers/v2/forecast.controller");
const { auth, checkShopContext } = require("../../middleware/authMiddleware");

/**
 * V2 Forecast Engine Routes
 * Base: /api/v2/forecast
 */

// GET /api/v2/forecast/short — 7-day demand forecast for all products
router.get("/short", auth, checkShopContext, getShortForecast);

// GET /api/v2/forecast/medium — 30-day demand forecast
router.get("/medium", auth, checkShopContext, getMediumForecast);

// GET /api/v2/forecast/product/:productId — Forecast for a specific product
router.get("/product/:productId", auth, getProductForecast);

// GET /api/v2/forecast/reorder — Reorder metrics (EOQ, ROP, days to stockout)
router.get("/reorder", auth, checkShopContext, getReorderMetrics);

// GET /api/v2/forecast/stock-risk — Stock risk scores sorted by urgency
router.get("/stock-risk", auth, checkShopContext, getStockRisk);

module.exports = router;
