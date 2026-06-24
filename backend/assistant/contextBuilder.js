const forecastEngine        = require("../engines/forecastEngine");
const inventoryIntelligence = require("../engines/inventoryIntelligence");
const recommendationEngine  = require("../engines/recommendationEngine");
const externalSignals       = require("../engines/externalSignals");
const { INTENTS }           = require("./intentRouter");

/**
 * Context Builder — V2.6 AI Business Assistant
 *
 * Assembles pre-computed analytical context for each intent type.
 * All data comes from engine layers — the LLM receives ONLY this structured JSON.
 *
 * CRITICAL RULE:
 *   The LLM must never compute, estimate, or calculate.
 *   This module is the ONLY source of numbers in any assistant response.
 */

/**
 * Build context for REORDER_QUERY intent.
 * Answers: "What products should I reorder?"
 */
const buildReorderContext = async (shopId) => {
    const [recommendations, criticalRisks] = await Promise.all([
        recommendationEngine.getReorderRecommendations(shopId),
        forecastEngine.getCriticalStockRisks(shopId),
    ]);

    return {
        intent:             INTENTS.REORDER_QUERY,
        reorderRecommendations: recommendations,
        criticalRiskCount:  criticalRisks.filter((r) => r.riskLabel === "CRITICAL").length,
        generatedAt:        new Date().toISOString(),
    };
};

/**
 * Build context for STOCKOUT_RISK intent.
 * Answers: "Which products may run out this week?"
 */
const buildStockoutContext = async (shopId) => {
    const [criticalRisks, shortForecast] = await Promise.all([
        forecastEngine.getCriticalStockRisks(shopId),
        forecastEngine.getShortTermForecast(shopId),
    ]);

    return {
        intent:           INTENTS.STOCKOUT_RISK,
        criticalRisks:    criticalRisks.slice(0, 10),
        forecastSummary:  shortForecast.slice(0, 5).map((f) => ({
            productId:    f.productId,
            productName:  f.productName,
            forecastedUnits7d: f.forecastedTotalUnits,
            currentStock: f.currentStock,
        })),
        generatedAt:      new Date().toISOString(),
    };
};

/**
 * Build context for SLOW_MOVERS and DEAD_STOCK intents.
 * Answers: "What are my slow-moving products?"
 */
const buildSlowMoversContext = async (shopId) => {
    const [velocitySummary, capitalRisk] = await Promise.all([
        inventoryIntelligence.getVelocitySummary(shopId),
        inventoryIntelligence.getDeadStockRisk(shopId),
    ]);

    return {
        intent:         INTENTS.SLOW_MOVERS,
        velocitySummary: {
            total:        velocitySummary.total,
            fastMovers:   velocitySummary.fastMovers,
            slowMovers:   velocitySummary.slowMovers,
            deadStock:    velocitySummary.deadStock,
        },
        slowMovers:     velocitySummary.classification
            .filter((p) => p.velocityClass === "C")
            .slice(0, 10),
        deadStockRisk:  capitalRisk,
        generatedAt:    new Date().toISOString(),
    };
};

/**
 * Build context for CAPITAL_RISK intent.
 */
const buildCapitalRiskContext = async (shopId) => {
    const analysis = await inventoryIntelligence.analyzeCapitalRisk(shopId);

    return {
        intent:       INTENTS.CAPITAL_RISK,
        summary:      analysis.summary,
        topDeadStock: analysis.deadStockProducts.slice(0, 8),
        topSlowStock: analysis.slowStockProducts.slice(0, 5),
        generatedAt:  new Date().toISOString(),
    };
};

/**
 * Build context for FORECAST_QUERY intent.
 * Answers: "Which products are expected to grow next month?"
 */
const buildForecastContext = async (shopId) => {
    const [shortForecast, mediumForecast, signalContext] = await Promise.all([
        forecastEngine.getShortTermForecast(shopId),
        forecastEngine.getMediumTermForecast(shopId),
        externalSignals.getSignalContext(shopId),
    ]);

    return {
        intent:          INTENTS.FORECAST_QUERY,
        sevenDayForecast: shortForecast.slice(0, 10),
        thirtyDayForecast: mediumForecast.slice(0, 10),
        externalSignals: signalContext,
        generatedAt:     new Date().toISOString(),
    };
};

/**
 * Build context for DECLINE_QUERY intent.
 * Answers: "Why are sales decreasing for Product X?"
 */
const buildDeclineContext = async (shopId) => {
    const [trendData, signalContext, velocitySummary] = await Promise.all([
        inventoryIntelligence.classifyProductVelocity(shopId),
        externalSignals.getSignalContext(shopId),
        inventoryIntelligence.getVelocitySummary(shopId),
    ]);

    const declining = trendData
        .filter((p) => p.velocityClass === "C" || p.velocityClass === "D")
        .slice(0, 10);

    return {
        intent:          INTENTS.DECLINE_QUERY,
        decliningProducts: declining,
        externalSignals: signalContext,
        summary: {
            decliningCount: velocitySummary.slowMovers + velocitySummary.deadStock,
            totalProducts:  velocitySummary.total,
        },
        generatedAt:     new Date().toISOString(),
    };
};

/**
 * Build context for GROWTH_QUERY intent.
 * Answers: "Which products are trending up?"
 */
const buildGrowthContext = async (shopId) => {
    const [opportunities, fastMovers, signalContext] = await Promise.all([
        recommendationEngine.getOpportunityScores(shopId),
        inventoryIntelligence.getFastMovers(shopId),
        externalSignals.getUpcomingImpactEvents(14),
    ]);

    return {
        intent:           INTENTS.GROWTH_QUERY,
        highOpportunity:  opportunities.highOpportunity.slice(0, 8),
        fastMovers:       fastMovers.slice(0, 8),
        upcomingEvents:   signalContext.allEvents?.slice(0, 5) || [],
        generatedAt:      new Date().toISOString(),
    };
};

/**
 * Build context for PERFORMANCE_QUERY intent.
 */
const buildPerformanceContext = async (shopId) => {
    const [turnover, velocitySummary, reorderCount] = await Promise.all([
        inventoryIntelligence.calculateTurnoverRatio(shopId, 30),
        inventoryIntelligence.getVelocitySummary(shopId),
        forecastEngine.getShopReorderMetrics(shopId, true).then((r) => r.length),
    ]);

    return {
        intent:          INTENTS.PERFORMANCE_QUERY,
        turnoverAnalysis: turnover,
        velocitySummary: {
            total:       velocitySummary.total,
            fastMovers:  velocitySummary.fastMovers,
            slowMovers:  velocitySummary.slowMovers,
            deadStock:   velocitySummary.deadStock,
        },
        productsNeedingReorder: reorderCount,
        generatedAt:     new Date().toISOString(),
    };
};

/**
 * Build context for TURNOVER_QUERY intent.
 */
const buildTurnoverContext = async (shopId) => {
    const [turnover, breakdown] = await Promise.all([
        inventoryIntelligence.calculateTurnoverRatio(shopId, 30),
        inventoryIntelligence.getProductTurnoverBreakdown(shopId, 30),
    ]);

    return {
        intent:          INTENTS.TURNOVER_QUERY,
        turnoverRatio:   turnover,
        productBreakdown: breakdown.slice(0, 10),
        generatedAt:     new Date().toISOString(),
    };
};

/**
 * Build general context (fallback for unclassified questions).
 */
const buildGeneralContext = async (shopId) => {
    const [velocitySummary, lowStock] = await Promise.all([
        inventoryIntelligence.getVelocitySummary(shopId),
        inventoryIntelligence.getLowStockProducts(shopId),
    ]);

    return {
        intent:       INTENTS.GENERAL_QUERY,
        overview: {
            totalProducts: velocitySummary.total,
            fastMovers:    velocitySummary.fastMovers,
            slowMovers:    velocitySummary.slowMovers,
            deadStock:     velocitySummary.deadStock,
            lowStockCount: lowStock.length,
        },
        generatedAt:  new Date().toISOString(),
    };
};

/**
 * Build the appropriate context for a given intent.
 *
 * @param {string} intent - From INTENTS enum
 * @param {string} shopId
 * @returns {Promise<Object>}
 */
const buildContext = async (intent, shopId) => {
    switch (intent) {
        case INTENTS.REORDER_QUERY:     return buildReorderContext(shopId);
        case INTENTS.STOCKOUT_RISK:     return buildStockoutContext(shopId);
        case INTENTS.SLOW_MOVERS:       return buildSlowMoversContext(shopId);
        case INTENTS.DEAD_STOCK:        return buildSlowMoversContext(shopId); // Same engines
        case INTENTS.CAPITAL_RISK:      return buildCapitalRiskContext(shopId);
        case INTENTS.FORECAST_QUERY:    return buildForecastContext(shopId);
        case INTENTS.DECLINE_QUERY:     return buildDeclineContext(shopId);
        case INTENTS.GROWTH_QUERY:      return buildGrowthContext(shopId);
        case INTENTS.PERFORMANCE_QUERY: return buildPerformanceContext(shopId);
        case INTENTS.TURNOVER_QUERY:    return buildTurnoverContext(shopId);
        default:                        return buildGeneralContext(shopId);
    }
};

module.exports = {
    buildContext,
    // Individual builders exported for testing
    buildReorderContext,
    buildStockoutContext,
    buildSlowMoversContext,
    buildCapitalRiskContext,
    buildForecastContext,
    buildDeclineContext,
    buildGrowthContext,
    buildPerformanceContext,
    buildTurnoverContext,
    buildGeneralContext,
};
