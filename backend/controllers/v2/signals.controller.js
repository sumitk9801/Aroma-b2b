const asyncHandler    = require("../../utils/asyncHandler");
const ApiResponse     = require("../../utils/ApiResponse");
const externalSignals = require("../../engines/externalSignals");
const { getUpcomingFestivals }  = require("../../analytics/adapters/festivalCalendarAdapter");
const { getUpcomingHolidays  }  = require("../../analytics/adapters/holidayAdapter");

/**
 * Signals Controller — V2.4 API
 * Handles /api/v2/signals/* endpoints
 */

const getSignalHistory = asyncHandler(async (req, res) => {
    const shopId     = req.headers["x-shop-id"] || req.user?.shopId;
    const days       = parseInt(req.query.days || "30", 10);
    const signalType = req.query.type || null;

    if (!shopId) return res.status(400).json(new ApiResponse(400, null, "Shop context required"));

    const result = await externalSignals.getSignalHistory(shopId, days, signalType);
    return res.status(200).json(new ApiResponse(200, { count: result.length, signals: result }, "Signal history"));
});

const getAdjustedMetrics = asyncHandler(async (req, res) => {
    const shopId = req.headers["x-shop-id"] || req.user?.shopId;
    const days   = parseInt(req.query.days || "30", 10);

    if (!shopId) return res.status(400).json(new ApiResponse(400, null, "Shop context required"));

    const result = await externalSignals.getAdjustedMetricsHistory(shopId, days);
    return res.status(200).json(new ApiResponse(200, result, "Signal-adjusted metrics"));
});

const getUpcomingEvents = asyncHandler(async (req, res) => {
    const days   = parseInt(req.query.days || "14", 10);
    const result = externalSignals.getUpcomingImpactEvents(days);
    return res.status(200).json(new ApiResponse(200, result, "Upcoming impact events"));
});

const getWeatherImpact = asyncHandler(async (req, res) => {
    const shopId = req.headers["x-shop-id"] || req.user?.shopId;
    if (!shopId) return res.status(400).json(new ApiResponse(400, null, "Shop context required"));

    const weatherSignals = await externalSignals.getSignalHistory(shopId, 7, "WEATHER");
    return res.status(200).json(new ApiResponse(200, { signals: weatherSignals }, "Weather impact analysis"));
});

const getSeasonalInsights = asyncHandler(async (req, res) => {
    const festivals = getUpcomingFestivals(90);
    const holidays  = getUpcomingHolidays(90);
    return res.status(200).json(new ApiResponse(200, {
        upcomingFestivals: festivals,
        upcomingHolidays:  holidays,
        highImpactCount:   festivals.filter((f) => f.intensity >= 1.3).length,
    }, "Seasonal insights (next 90 days)"));
});

module.exports = { getSignalHistory, getAdjustedMetrics, getUpcomingEvents, getWeatherImpact, getSeasonalInsights };
