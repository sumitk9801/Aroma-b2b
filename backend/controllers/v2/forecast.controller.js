const asyncHandler  = require("../../utils/asyncHandler");
const ApiResponse   = require("../../utils/ApiResponse");
const forecastEngine = require("../../engines/forecastEngine");

/**
 * Forecast Controller — V2 API
 * Handles /api/v2/forecast/* endpoints
 */

const getShortForecast = asyncHandler(async (req, res) => {
    const shopId = req.headers["x-shop-id"] || req.user?.shopId;
    if (!shopId) return res.status(400).json(new ApiResponse(400, null, "Shop context required"));

    const forecast = await forecastEngine.getShortTermForecast(shopId);
    return res.status(200).json(new ApiResponse(200, { horizon: 7, forecasts: forecast }, "7-day demand forecast"));
});

const getMediumForecast = asyncHandler(async (req, res) => {
    const shopId = req.headers["x-shop-id"] || req.user?.shopId;
    if (!shopId) return res.status(400).json(new ApiResponse(400, null, "Shop context required"));

    const forecast = await forecastEngine.getMediumTermForecast(shopId);
    return res.status(200).json(new ApiResponse(200, { horizon: 30, forecasts: forecast }, "30-day demand forecast"));
});

const getProductForecast = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const horizon       = parseInt(req.query.horizon || "7", 10);

    const forecast = await forecastEngine.forecastProductDemand(productId, horizon);
    return res.status(200).json(new ApiResponse(200, forecast, `${horizon}-day forecast for product`));
});

const getReorderMetrics = asyncHandler(async (req, res) => {
    const shopId   = req.headers["x-shop-id"] || req.user?.shopId;
    const onlyRisk = req.query.onlyAtRisk === "true";

    if (!shopId) return res.status(400).json(new ApiResponse(400, null, "Shop context required"));

    const metrics = await forecastEngine.getShopReorderMetrics(shopId, onlyRisk);
    return res.status(200).json(new ApiResponse(200, { count: metrics.length, products: metrics }, "Reorder metrics"));
});

const getStockRisk = asyncHandler(async (req, res) => {
    const shopId  = req.headers["x-shop-id"] || req.user?.shopId;
    const filter  = req.query.minRisk || null;

    if (!shopId) return res.status(400).json(new ApiResponse(400, null, "Shop context required"));

    const risks = await forecastEngine.scoreShopStockRisk(shopId, filter);
    return res.status(200).json(new ApiResponse(200, { count: risks.length, products: risks }, "Stock risk scores"));
});

module.exports = { getShortForecast, getMediumForecast, getProductForecast, getReorderMetrics, getStockRisk };
