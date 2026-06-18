const { getAvgDailyDemand, DEFAULT_LEAD_TIME_DAYS } = require("./reorderCalculator");
const { prisma } = require("../../db/db");

/**
 * Stock Risk Scorer — V2.4 Forecast Engine
 *
 * Scores each active product's stockout risk on a 0–100 scale.
 * Used by the AI Business Assistant to answer "Which products may run out this week?"
 *
 * Risk Score Formula:
 *   Base score determined by days-to-stockout vs lead time:
 *     daysToStockout <= 1           → score 95–100 (CRITICAL)
 *     daysToStockout <= leadTime    → score 75–94  (HIGH)
 *     daysToStockout <= leadTime*2  → score 50–74  (MEDIUM)
 *     daysToStockout <= 30          → score 20–49  (LOW)
 *     daysToStockout > 30 or null   → score 0–19   (SAFE)
 */

const RISK_LABELS = {
    CRITICAL: "CRITICAL", // Stockout imminent (≤1 day)
    HIGH:     "HIGH",     // Stockout within lead time
    MEDIUM:   "MEDIUM",   // Stockout within 2× lead time
    LOW:      "LOW",      // Stockout within 30 days
    SAFE:     "SAFE",     // No near-term risk
};

/**
 * Score a single product's stockout risk.
 *
 * @param {string} productId
 * @param {number} [leadTimeDays]
 * @returns {Promise<Object>}
 */
const scoreProductRisk = async (productId, leadTimeDays = DEFAULT_LEAD_TIME_DAYS) => {
    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
            id: true,
            name: true,
            skuCode: true,
            currentStock: true,
            minimumStock: true,
            shopId: true,
        },
    });

    if (!product) throw new Error(`Product not found: ${productId}`);

    const avgDailyDemand = await getAvgDailyDemand(productId);

    let riskScore    = 0;
    let riskLabel    = RISK_LABELS.SAFE;
    let daysToStockout = null;
    let action       = "No action needed";

    if (avgDailyDemand > 0) {
        daysToStockout = parseFloat((product.currentStock / avgDailyDemand).toFixed(1));

        if (daysToStockout <= 1) {
            riskScore = 95 + Math.min(5, Math.round((1 - daysToStockout) * 5));
            riskLabel = RISK_LABELS.CRITICAL;
            action    = "Order immediately — stockout within 24 hours";
        } else if (daysToStockout <= leadTimeDays) {
            riskScore = 75 + Math.round((leadTimeDays - daysToStockout) / leadTimeDays * 19);
            riskLabel = RISK_LABELS.HIGH;
            action    = `Order now — stock will run out before supplier delivers (${daysToStockout} days left)`;
        } else if (daysToStockout <= leadTimeDays * 2) {
            riskScore = 50 + Math.round((leadTimeDays * 2 - daysToStockout) / leadTimeDays * 24);
            riskLabel = RISK_LABELS.MEDIUM;
            action    = `Plan reorder soon — ${daysToStockout} days of stock remaining`;
        } else if (daysToStockout <= 30) {
            riskScore = 20 + Math.round((30 - daysToStockout) / 30 * 29);
            riskLabel = RISK_LABELS.LOW;
            action    = `Monitor — ${daysToStockout} days of stock remaining`;
        } else {
            riskScore = Math.max(0, Math.round(10 - (daysToStockout - 30) / 10));
            riskLabel = RISK_LABELS.SAFE;
            action    = `No action needed — ${daysToStockout} days of stock`;
        }
    } else {
        // No recent demand — low risk but flag as dead stock candidate
        riskScore = product.currentStock <= product.minimumStock ? 15 : 0;
        riskLabel = RISK_LABELS.SAFE;
        action    = "No recent sales — monitor for dead stock";
    }

    return {
        productId:     product.id,
        productName:   product.name,
        skuCode:       product.skuCode,
        currentStock:  product.currentStock,
        minimumStock:  product.minimumStock,
        avgDailyDemand,
        daysToStockout,
        riskScore:     Math.min(100, Math.max(0, riskScore)),
        riskLabel,
        action,
        leadTimeDays,
    };
};

/**
 * Score all active products in a shop for stockout risk.
 * Returns sorted list — most critical first.
 *
 * @param {string} shopId
 * @param {string} [minRiskLabel] - Filter: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "SAFE"
 * @returns {Promise<Array>}
 */
const scoreShopStockRisk = async (shopId, minRiskLabel = null) => {
    const products = await prisma.product.findMany({
        where: { shopId, isActive: true },
        select: { id: true },
    });

    const scores = await Promise.all(
        products.map((p) => scoreProductRisk(p.id))
    );

    const riskOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, SAFE: 4 };

    const filtered = minRiskLabel
        ? scores.filter((s) => riskOrder[s.riskLabel] <= riskOrder[minRiskLabel])
        : scores;

    return filtered.sort((a, b) => b.riskScore - a.riskScore);
};

/**
 * Get only critical + high risk products — used by AI Assistant for stockout alerts.
 * @param {string} shopId
 */
const getCriticalStockRisks = (shopId) => scoreShopStockRisk(shopId, "HIGH");

module.exports = {
    scoreProductRisk,
    scoreShopStockRisk,
    getCriticalStockRisks,
    RISK_LABELS,
};
