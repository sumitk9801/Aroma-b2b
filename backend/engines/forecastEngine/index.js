/**
 * Forecast Engine — Public API Surface
 *
 * This is the only import path other layers should use when interacting
 * with forecasting capabilities. Internal module paths are considered
 * private implementation details and may change without notice.
 *
 * Architecture position:
 *   Analytics Layer → [Forecast Engine] → Inventory Intelligence Engine
 *                                       → Recommendation Engine
 *                                       → AI Business Assistant
 */

const demandForecaster  = require("./demandForecaster");
const reorderCalculator = require("./reorderCalculator");
const stockRiskScorer   = require("./stockRiskScorer");

module.exports = {
    // ── Demand Forecasting ────────────────────────────────────────────
    /** Forecast demand for a single product over a given horizon. */
    forecastProductDemand: demandForecaster.forecastProductDemand,

    /** Forecast demand for all active products in a shop (7 days). */
    getShortTermForecast: demandForecaster.getShortTermForecast,

    /** Forecast demand for all active products in a shop (30 days). */
    getMediumTermForecast: demandForecaster.getMediumTermForecast,

    /** Forecast for any shop and custom horizon. */
    forecastShopDemand: demandForecaster.forecastShopDemand,

    // ── Reorder Calculation ───────────────────────────────────────────
    /** EOQ, ROP, and safety stock for a single product. */
    calculateReorderMetrics: reorderCalculator.calculateReorderMetrics,

    /** Reorder metrics for all products in a shop. Pass onlyAtRisk=true for critical ones. */
    getShopReorderMetrics: reorderCalculator.getShopReorderMetrics,

    // ── Stock Risk Scoring ────────────────────────────────────────────
    /** 0–100 risk score + risk label for a single product. */
    scoreProductRisk: stockRiskScorer.scoreProductRisk,

    /** Risk scores for all products in a shop, sorted by risk. */
    scoreShopStockRisk: stockRiskScorer.scoreShopStockRisk,

    /** Returns only CRITICAL + HIGH risk products (used by AI Assistant). */
    getCriticalStockRisks: stockRiskScorer.getCriticalStockRisks,

    // ── Constants ─────────────────────────────────────────────────────
    FORECAST_HORIZONS: demandForecaster.FORECAST_HORIZONS,
    RISK_LABELS:       stockRiskScorer.RISK_LABELS,
};
