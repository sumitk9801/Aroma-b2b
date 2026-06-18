const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse  = require("../../utils/ApiResponse");
const assistant    = require("../../assistant");

/**
 * Assistant Controller — V2.6
 * Handles /api/v2/assistant/* endpoints
 */

/**
 * POST /api/v2/assistant/ask
 * Main Q&A endpoint — answers natural language inventory questions.
 */
const askQuestion = asyncHandler(async (req, res) => {
    const { question, includeContext = false } = req.body;
    const shopId = req.headers["x-shop-id"] || req.user?.shopId;

    if (!question || typeof question !== "string" || question.trim().length === 0) {
        return res.status(400).json(new ApiResponse(400, null, "Question is required"));
    }
    if (!shopId) {
        return res.status(400).json(new ApiResponse(400, null, "Shop context required (x-shop-id header)"));
    }

    const result = await assistant.ask_question({
        shopId,
        question: question.trim(),
        includeContext: includeContext === true || includeContext === "true",
    });

    if (!result.success) {
        // LLM not configured — return fallback analytics data
        return res.status(200).json(
            new ApiResponse(200, result.fallback, "LLM not configured — raw analytics returned")
        );
    }

    return res.status(200).json(
        new ApiResponse(200, result.data, "Assistant response generated successfully")
    );
});

/**
 * GET /api/v2/assistant/suggestions
 * Returns proactive insight suggestions without a question.
 */
const getSuggestions = asyncHandler(async (req, res) => {
    const shopId = req.headers["x-shop-id"] || req.user?.shopId;
    if (!shopId) {
        return res.status(400).json(new ApiResponse(400, null, "Shop context required"));
    }

    const result = await assistant.getSuggestions(shopId);
    return res.status(200).json(
        new ApiResponse(200, result, "Proactive suggestions generated successfully")
    );
});

/**
 * GET /api/v2/assistant/daily-briefing
 * Morning business briefing — a summary of the day's key inventory priorities.
 */
const getDailyBriefing = asyncHandler(async (req, res) => {
    const shopId = req.headers["x-shop-id"] || req.user?.shopId;
    if (!shopId) {
        return res.status(400).json(new ApiResponse(400, null, "Shop context required"));
    }

    const result = await assistant.getDailyBriefing(shopId);
    return res.status(200).json(
        new ApiResponse(200, result.data, "Daily briefing generated successfully")
    );
});

module.exports = { askQuestion, getSuggestions, getDailyBriefing };
