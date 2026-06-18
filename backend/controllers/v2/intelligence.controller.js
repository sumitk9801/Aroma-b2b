const asyncHandler          = require("../../utils/asyncHandler");
const ApiResponse           = require("../../utils/ApiResponse");
const inventoryIntelligence = require("../../engines/inventoryIntelligence");

/**
 * Intelligence Controller — V2 API
 * Handles /api/v2/intelligence/* endpoints
 */

const getVelocityClassification = asyncHandler(async (req, res) => {
    const shopId = req.headers["x-shop-id"] || req.user?.shopId;
    if (!shopId) return res.status(400).json(new ApiResponse(400, null, "Shop context required"));

    const result = await inventoryIntelligence.getVelocitySummary(shopId);
    return res.status(200).json(new ApiResponse(200, result, "ABC velocity classification"));
});

const getTurnoverAnalysis = asyncHandler(async (req, res) => {
    const shopId = req.headers["x-shop-id"] || req.user?.shopId;
    const days   = parseInt(req.query.days || "30", 10);

    if (!shopId) return res.status(400).json(new ApiResponse(400, null, "Shop context required"));

    const [turnover, breakdown] = await Promise.all([
        inventoryIntelligence.calculateTurnoverRatio(shopId, days),
        inventoryIntelligence.getProductTurnoverBreakdown(shopId, days),
    ]);

    return res.status(200).json(new ApiResponse(200, { turnover, breakdown }, "Turnover analysis"));
});

const getCapitalRisk = asyncHandler(async (req, res) => {
    const shopId = req.headers["x-shop-id"] || req.user?.shopId;
    if (!shopId) return res.status(400).json(new ApiResponse(400, null, "Shop context required"));

    const result = await inventoryIntelligence.analyzeCapitalRisk(shopId);
    return res.status(200).json(new ApiResponse(200, result, "Capital risk analysis"));
});

const getLowStock = asyncHandler(async (req, res) => {
    const shopId = req.headers["x-shop-id"] || req.user?.shopId;
    if (!shopId) return res.status(400).json(new ApiResponse(400, null, "Shop context required"));

    const result = await inventoryIntelligence.getLowStockProducts(shopId);
    return res.status(200).json(new ApiResponse(200, { count: result.length, products: result }, "Low stock products"));
});

module.exports = { getVelocityClassification, getTurnoverAnalysis, getCapitalRisk, getLowStock };
