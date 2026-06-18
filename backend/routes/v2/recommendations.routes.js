const express = require("express");
const router  = express.Router();
const { getReorderRecommendations, getPromotionRecommendations, getOpportunityScores } = require("../../controllers/v2/recommendations.controller");
const { auth, checkShopContext } = require("../../middleware/authMiddleware");

/**
 * V2 Recommendation Engine Routes
 * Base: /api/v2/recommendations
 */

// GET /api/v2/recommendations/reorder — Prioritized reorder recommendations
router.get("/reorder", auth, checkShopContext, getReorderRecommendations);

// GET /api/v2/recommendations/promotions — Markdown/bundle/clearance recommendations
router.get("/promotions", auth, checkShopContext, getPromotionRecommendations);

// GET /api/v2/recommendations/opportunities — Opportunity-scored products (0–100)
router.get("/opportunities", auth, checkShopContext, getOpportunityScores);

module.exports = router;
