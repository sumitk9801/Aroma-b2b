const asyncHandler         = require("../../utils/asyncHandler");
const ApiResponse          = require("../../utils/ApiResponse");
const recommendationEngine = require("../../engines/recommendationEngine");

/**
 * Recommendations Controller — V2 API
 * Handles /api/v2/recommendations/* endpoints
 */

const getReorderRecommendations = asyncHandler(async (req, res) => {
    const shopId = req.headers["x-shop-id"] || req.user?.shopId;
    if (!shopId) return res.status(400).json(new ApiResponse(400, null, "Shop context required"));

    const result = await recommendationEngine.getReorderRecommendations(shopId);
    return res.status(200).json(new ApiResponse(200, result, "Reorder recommendations"));
});

const getPromotionRecommendations = asyncHandler(async (req, res) => {
    const shopId = req.headers["x-shop-id"] || req.user?.shopId;
    if (!shopId) return res.status(400).json(new ApiResponse(400, null, "Shop context required"));

    const result = await recommendationEngine.getPromotionRecommendations(shopId);
    return res.status(200).json(new ApiResponse(200, result, "Promotion recommendations"));
});

const getOpportunityScores = asyncHandler(async (req, res) => {
    const shopId = req.headers["x-shop-id"] || req.user?.shopId;
    const limit  = parseInt(req.query.limit || "20", 10);

    if (!shopId) return res.status(400).json(new ApiResponse(400, null, "Shop context required"));

    const result = await recommendationEngine.getOpportunityScores(shopId, limit);
    return res.status(200).json(new ApiResponse(200, result, "Opportunity scores"));
});

module.exports = { getReorderRecommendations, getPromotionRecommendations, getOpportunityScores };
