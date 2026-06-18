const asyncHandler   = require("../../utils/asyncHandler");
const ApiResponse    = require("../../utils/ApiResponse");
const { getStoredTrends, runTrendDetection } = require("../../analytics/pipelines/trendDetector");

/**
 * Trends Controller — V2.5 API
 * Handles /api/v2/trends/* endpoints
 */

const getTrendingSummary = asyncHandler(async (req, res) => {
    const shopId = req.headers["x-shop-id"] || req.user?.shopId;
    if (!shopId) return res.status(400).json(new ApiResponse(400, null, "Shop context required"));

    const all = await getStoredTrends(shopId);
    const summary = {
        TRENDING_UP: all.filter((p) => p.trendLabel === "TRENDING_UP").length,
        GROWING:     all.filter((p) => p.trendLabel === "GROWING").length,
        STABLE:      all.filter((p) => p.trendLabel === "STABLE").length,
        DECLINING:   all.filter((p) => p.trendLabel === "DECLINING").length,
        AT_RISK:     all.filter((p) => p.trendLabel === "AT_RISK").length,
        total:       all.length,
    };
    return res.status(200).json(new ApiResponse(200, { summary, products: all }, "Trend summary"));
});

const getRisingProducts = asyncHandler(async (req, res) => {
    const shopId = req.headers["x-shop-id"] || req.user?.shopId;
    if (!shopId) return res.status(400).json(new ApiResponse(400, null, "Shop context required"));

    const rising = await getStoredTrends(shopId, "TRENDING_UP");
    const growing = await getStoredTrends(shopId, "GROWING");
    return res.status(200).json(new ApiResponse(200, {
        trending: rising,
        growing,
        total: rising.length + growing.length,
    }, "Rising products"));
});

const getDecliningProducts = asyncHandler(async (req, res) => {
    const shopId = req.headers["x-shop-id"] || req.user?.shopId;
    if (!shopId) return res.status(400).json(new ApiResponse(400, null, "Shop context required"));

    const declining = await getStoredTrends(shopId, "DECLINING");
    const atRisk    = await getStoredTrends(shopId, "AT_RISK");
    return res.status(200).json(new ApiResponse(200, {
        declining,
        atRisk,
        total: declining.length + atRisk.length,
    }, "Declining products"));
});

const getOpportunities = asyncHandler(async (req, res) => {
    const shopId = req.headers["x-shop-id"] || req.user?.shopId;
    if (!shopId) return res.status(400).json(new ApiResponse(400, null, "Shop context required"));

    const all = await getStoredTrends(shopId);
    const highOpportunity = all.filter((p) => p.opportunityScore >= 70);
    return res.status(200).json(new ApiResponse(200, {
        count: highOpportunity.length,
        products: highOpportunity,
    }, "Opportunity products"));
});

// Admin-only: manually trigger trend detection for a shop
const triggerTrendDetection = asyncHandler(async (req, res) => {
    const shopId = req.headers["x-shop-id"] || req.user?.shopId;
    if (!shopId) return res.status(400).json(new ApiResponse(400, null, "Shop context required"));

    const result = await runTrendDetection(shopId);
    return res.status(200).json(new ApiResponse(200, result, "Trend detection completed"));
});

module.exports = { getTrendingSummary, getRisingProducts, getDecliningProducts, getOpportunities, triggerTrendDetection };
