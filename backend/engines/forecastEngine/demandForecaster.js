const { prisma } = require("../../db/db");

/**
 * Demand Forecaster — V2.4 Forecast Engine
 *
 * Computes short-term and medium-term demand forecasts using rolling
 * weighted averages on the DailyProductPerformance precomputed dataset.
 * No external ML libraries required — pure statistical computation in JS.
 *
 * Algorithm: Exponentially Weighted Moving Average (EWMA)
 *   - Alpha 0.7 weights recent days more heavily.
 *   - Falls back to simple mean if fewer than 3 data points exist.
 */

const FORECAST_HORIZONS = {
    SHORT:  7,   // 7-day forecast
    MEDIUM: 30,  // 30-day forecast
    LONG:   90,  // 90-day forecast
};

const EWMA_ALPHA = 0.7; // Recency weight (higher = more weight on recent data)

/**
 * Fetch historical daily performance for a single product.
 * @param {string} productId
 * @param {number} lookbackDays
 * @returns {Promise<Array<{date: string, quantitySold: number, revenue: number}>>}
 */
const getProductHistory = async (productId, lookbackDays = 60) => {
    const since = new Date();
    since.setDate(since.getDate() - lookbackDays);
    since.setHours(0, 0, 0, 0);

    const records = await prisma.dailyProductPerformance.findMany({
        where: {
            productId,
            date: { gte: since },
        },
        orderBy: { date: "asc" },
        select: { date: true, quantitySold: true, revenue: true },
    });

    return records.map((r) => ({
        date: r.date.toISOString().split("T")[0],
        quantitySold: r.quantitySold,
        revenue: r.revenue,
    }));
};

/**
 * Apply Exponentially Weighted Moving Average to a value series.
 * @param {number[]} values - Ordered array of numeric values (oldest → newest).
 * @returns {number} EWMA forecast for the next period.
 */
const applyEWMA = (values) => {
    if (!values.length) return 0;
    if (values.length === 1) return values[0];

    let ewma = values[0];
    for (let i = 1; i < values.length; i++) {
        ewma = EWMA_ALPHA * values[i] + (1 - EWMA_ALPHA) * ewma;
    }
    return parseFloat(ewma.toFixed(4));
};

/**
 * Forecast daily demand for a single product.
 *
 * @param {string} productId
 * @param {number} [horizonDays=7] - Number of days to forecast.
 * @returns {Promise<{
 *   productId: string,
 *   horizon: number,
 *   forecastedDailyUnits: number,
 *   forecastedDailyRevenue: number,
 *   forecastedTotalUnits: number,
 *   forecastedTotalRevenue: number,
 *   confidenceLevel: string,
 *   dataPoints: number
 * }>}
 */
const forecastProductDemand = async (productId, horizonDays = FORECAST_HORIZONS.SHORT) => {
    const history = await getProductHistory(productId, 60);

    const quantities = history.map((h) => h.quantitySold);
    const revenues   = history.map((h) => h.revenue);

    const forecastedDailyUnits   = applyEWMA(quantities);
    const forecastedDailyRevenue = applyEWMA(revenues);

    // Confidence: LOW < 7 data points, MEDIUM 7–29, HIGH 30+
    const dataPoints = history.length;
    const confidenceLevel =
        dataPoints >= 30 ? "HIGH" :
        dataPoints >= 7  ? "MEDIUM" : "LOW";

    return {
        productId,
        horizon: horizonDays,
        forecastedDailyUnits:   parseFloat(forecastedDailyUnits.toFixed(2)),
        forecastedDailyRevenue: parseFloat(forecastedDailyRevenue.toFixed(2)),
        forecastedTotalUnits:   parseFloat((forecastedDailyUnits * horizonDays).toFixed(2)),
        forecastedTotalRevenue: parseFloat((forecastedDailyRevenue * horizonDays).toFixed(2)),
        confidenceLevel,
        dataPoints,
    };
};

/**
 * Forecast demand for all active products in a shop.
 *
 * @param {string} shopId
 * @param {number} [horizonDays=7]
 * @returns {Promise<Array>}
 */
const forecastShopDemand = async (shopId, horizonDays = FORECAST_HORIZONS.SHORT) => {
    const products = await prisma.product.findMany({
        where: { shopId, isActive: true },
        select: { id: true, name: true, skuCode: true, currentStock: true },
    });

    const forecasts = await Promise.all(
        products.map(async (product) => {
            const forecast = await forecastProductDemand(product.id, horizonDays);
            return {
                ...forecast,
                productName: product.name,
                skuCode:     product.skuCode,
                currentStock: product.currentStock,
            };
        })
    );

    return forecasts.sort((a, b) => b.forecastedTotalRevenue - a.forecastedTotalRevenue);
};

/**
 * Get short-term (7-day) forecast for a shop.
 * Convenience wrapper used by the AI Assistant context builder.
 * @param {string} shopId
 */
const getShortTermForecast = (shopId) => forecastShopDemand(shopId, FORECAST_HORIZONS.SHORT);

/**
 * Get medium-term (30-day) forecast for a shop.
 */
const getMediumTermForecast = (shopId) => forecastShopDemand(shopId, FORECAST_HORIZONS.MEDIUM);

module.exports = {
    forecastProductDemand,
    forecastShopDemand,
    getShortTermForecast,
    getMediumTermForecast,
    FORECAST_HORIZONS,
};
