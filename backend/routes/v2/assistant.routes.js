const express = require("express");
const router  = express.Router();
const { askQuestion, getSuggestions, getDailyBriefing } = require("../../controllers/v2/assistant.controller");
const { auth, checkShopContext } = require("../../middleware/authMiddleware");

/**
 * V2.6 AI Business Assistant Routes
 * Base: /api/v2/assistant
 */

// POST /api/v2/assistant/ask — Main Q&A endpoint
router.post("/ask", auth, checkShopContext, askQuestion);

// GET /api/v2/assistant/suggestions — Proactive insight suggestions
router.get("/suggestions", auth, checkShopContext, getSuggestions);

// GET /api/v2/assistant/daily-briefing — Morning business briefing
router.get("/daily-briefing", auth, checkShopContext, getDailyBriefing);

module.exports = router;
