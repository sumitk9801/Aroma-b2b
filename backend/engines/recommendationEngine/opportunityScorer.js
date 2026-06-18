const { prisma } = require("../../db/db");
const forecastEngine = require("../forecastEngine");

/**
 * Opportunity Scorer — Recommendation Engine / V2.5 Trend Engine
 *
 * Scores products by their growth opportunity using:
 *   1. Sales velocity trend (from ProductTrendScore if available, or computed live)
 *   2. Demand forecast trajectory (7-day vs 30-day)
 *   3. Current stock coverage vs projected demand
 *
 * Opportunity Score (0–100):
 *   60% weight on trend score (trendLabel)
 *   40% weight on demand forecast growth
 */

const TREND_WEIGHTS = {
    TRENDING_UP: 60,
    GROWING:     45,
    STABLE:      25,
    DECLINING:    5,
    AT_RISK:      0,
};

/**
 * Score a product for opportunity.
 * @param {Object} product - Product record with name, skuCode, currentStock
 * @param {Object} trendScore - ProductTrendScore record (may be null if V2.5 not yet run)
 * @param {Object} forecast   - 7-day demand forecast
 */
const computeOpportunityScore = (product, trendScore, forecast) => {
    // Trend component
    const trendLabel  = trendScore?.trendLabel || "STABLE";
    const trendWeight = TREND_WEIGHTS[trendLabel] ?? 25;

    // Demand component — how fast is demand growing?
    const forecastedUnits = forecast?.forecastedTotalUnits || 0;
    const currentStock    = product.currentStock || 0;
    const demandCoverage  = forecastedUnits > 0 ? currentStock / forecastedUnits : 10;

    // High demand relative to stock = higher opportunity (need to stock up)
    const demandScore = Math.min(40, demandCoverage < 1 ? 40 : demandCoverage < 2 ? 30 : demandCoverage < 5 ? 15 : 5);

    const opportunityScore = Math.round(Math.min(100, trendWeight + demandScore));

    return {
        opportunityScore,
        trendLabel,
        forecastedDemand7d: parseFloat((forecastedUnits).toFixed(2)),
        stockCoverageRatio: parseFloat(demandCoverage.toFixed(2)),
        suggestion:
            opportunityScore >= 80 ? "High opportunity — increase stock levels to capture demand" :
            opportunityScore >= 60 ? "Growing opportunity — monitor and prepare reorder" :
            opportunityScore >= 40 ? "Stable — maintain current stock strategy" :
            "Low opportunity — reduce exposure or reallocate capital",
    };
};

/**
 * Get opportunity-scored products for a shop.
 * Merges ProductTrendScore data (V2.5) with live forecast data.
 *
 * @param {string} shopId
 * @param {number} [limit=20] - Max products to return
 * @returns {Promise<Object>}
 */
const getOpportunityScores = async (shopId, limit = 20) => {
    // 1. Get all active products
    const products = await prisma.product.findMany({
        where: { shopId, isActive: true },
        select: { id: true, name: true, skuCode: true, currentStock: true },
    });

    // 2. Load stored trend scores (V2.5) if available
    const trendScores = await prisma.productTrendScore.findMany({
        where: { shopId },
    }).catch(() => []); // Graceful fallback if table doesn't exist yet

    const trendMap = new Map(trendScores.map((t) => [t.productId, t]));

    // 3. Get 7-day forecast for all products
    const forecasts = await forecastEngine.getShortTermForecast(shopId);
    const forecastMap = new Map(forecasts.map((f) => [f.productId, f]));

    // 4. Score each product
    const scored = products.map((product) => {
        const trendScore = trendMap.get(product.id) || null;
        const forecast   = forecastMap.get(product.id) || null;
        const scores     = computeOpportunityScore(product, trendScore, forecast);

        return {
            productId:        product.id,
            productName:      product.name,
            skuCode:          product.skuCode,
            currentStock:     product.currentStock,
            trendScore:       trendScore?.trendScore || 1.0,
            velocityLast7d:   trendScore?.velocityLast7d || null,
            ...scores,
        };
    });

    const sorted = scored.sort((a, b) => b.opportunityScore - a.opportunityScore);

    return {
        shopId,
        generatedAt:     new Date().toISOString(),
        total:           sorted.length,
        highOpportunity: sorted.filter((p) => p.opportunityScore >= 70),
        results:         sorted.slice(0, limit),
    };
};

module.exports = {
    getOpportunityScores,
    computeOpportunityScore,
    TREND_WEIGHTS,
};
