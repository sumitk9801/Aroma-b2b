const forecastEngine     = require("../forecastEngine");
const inventoryIntelligence = require("../inventoryIntelligence");

/**
 * Reorder Recommender — Recommendation Engine
 *
 * Combines Forecast Engine outputs and Inventory Intelligence data to generate
 * actionable "what to buy, how much, and when" recommendations.
 *
 * Priority tiers:
 *   1. CRITICAL  — Order immediately (stockout within lead time)
 *   2. URGENT    — Order this week
 *   3. PLANNED   — Order in the next 2 weeks
 *   4. MONITOR   — Watch for next replenishment cycle
 */

const PRIORITY_TIERS = {
    CRITICAL: { label: "CRITICAL", urgency: "Order immediately",          color: "#ef4444" },
    URGENT:   { label: "URGENT",   urgency: "Order within 3 days",        color: "#f97316" },
    PLANNED:  { label: "PLANNED",  urgency: "Plan order within 2 weeks",  color: "#eab308" },
    MONITOR:  { label: "MONITOR",  urgency: "Monitor for next cycle",     color: "#22c55e" },
};

/**
 * Generate prioritized reorder recommendations for a shop.
 *
 * @param {string} shopId
 * @returns {Promise<Object>}
 */
const getReorderRecommendations = async (shopId) => {
    const [riskScores, reorderMetrics] = await Promise.all([
        forecastEngine.getCriticalStockRisks(shopId),
        forecastEngine.getShopReorderMetrics(shopId, true), // Only at-risk
    ]);

    // Merge risk + reorder data by productId
    const riskMap = new Map(riskScores.map((r) => [r.productId, r]));

    const recommendations = reorderMetrics.map((metrics) => {
        const risk = riskMap.get(metrics.productId) || {};

        let priority;
        if (metrics.isCritical || (risk.riskLabel === "CRITICAL")) {
            priority = PRIORITY_TIERS.CRITICAL;
        } else if (risk.riskLabel === "HIGH" || metrics.needsReorder) {
            priority = PRIORITY_TIERS.URGENT;
        } else if (risk.riskLabel === "MEDIUM") {
            priority = PRIORITY_TIERS.PLANNED;
        } else {
            priority = PRIORITY_TIERS.MONITOR;
        }

        return {
            productId:          metrics.productId,
            productName:        metrics.productName,
            skuCode:            metrics.skuCode,
            currentStock:       metrics.currentStock,
            minimumStock:       metrics.minimumStock,
            avgDailyDemand:     metrics.avgDailyDemand,
            daysToStockout:     metrics.daysToStockout ?? risk.daysToStockout,
            reorderPoint:       metrics.reorderPoint,
            recommendedOrderQty: Math.ceil(metrics.recommendedOrderQty || metrics.economicOrderQty),
            estimatedOrderCost: metrics.estimatedOrderCost,
            priority:           priority.label,
            urgencyMessage:     priority.urgency,
            riskScore:          risk.riskScore || 0,
            action:             risk.action || metrics.needsReorder
                ? `Reorder ${Math.ceil(metrics.recommendedOrderQty)} units of ${metrics.productName}`
                : "Monitor stock level",
        };
    });

    // Sort: CRITICAL → URGENT → PLANNED → MONITOR, then by daysToStockout
    const priorityOrder = { CRITICAL: 0, URGENT: 1, PLANNED: 2, MONITOR: 3 };
    recommendations.sort((a, b) => {
        const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (pDiff !== 0) return pDiff;
        if (a.daysToStockout === null) return 1;
        if (b.daysToStockout === null) return -1;
        return a.daysToStockout - b.daysToStockout;
    });

    const totalEstimatedCost = recommendations.reduce(
        (sum, r) => sum + (r.estimatedOrderCost || 0), 0
    );

    return {
        shopId,
        generatedAt:     new Date().toISOString(),
        totalRecommendations: recommendations.length,
        criticalCount:   recommendations.filter((r) => r.priority === "CRITICAL").length,
        urgentCount:     recommendations.filter((r) => r.priority === "URGENT").length,
        totalEstimatedCost: parseFloat(totalEstimatedCost.toFixed(2)),
        recommendations,
        priorityTiers:   PRIORITY_TIERS,
    };
};

module.exports = {
    getReorderRecommendations,
    PRIORITY_TIERS,
};
