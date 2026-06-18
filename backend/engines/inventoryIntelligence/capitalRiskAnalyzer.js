const { prisma } = require("../../db/db");

/**
 * Capital Risk Analyzer — Inventory Intelligence Engine
 *
 * Quantifies the financial risk from idle and dead inventory:
 *   - Capital Tied Up: Total cost of stock with zero recent sales
 *   - Holding Cost:    Annual cost of storing unsold inventory
 *   - Liquidation Value: Estimated recovery value (discounted)
 *   - Risk Score:      0–100 composite capital exposure score
 *
 * Used by the AI Assistant for "What are my risky products?" questions.
 */

const DEFAULT_DEAD_STOCK_DAYS     = 30;  // Days with zero sales = dead
const DEFAULT_HOLDING_COST_PCT    = 0.25; // 25% of value per year (storage + opportunity)
const DEFAULT_LIQUIDATION_DISCOUNT = 0.40; // Can recover 60% of cost via markdowns

/**
 * Analyze capital risk for all products in a shop.
 *
 * @param {string} shopId
 * @param {Object} [options]
 * @param {number} [options.deadStockDays]
 * @param {number} [options.holdingCostPct]
 * @param {number} [options.liquidationDiscount]
 * @returns {Promise<Object>}
 */
const analyzeCapitalRisk = async (shopId, options = {}) => {
    const {
        deadStockDays       = DEFAULT_DEAD_STOCK_DAYS,
        holdingCostPct      = DEFAULT_HOLDING_COST_PCT,
        liquidationDiscount = DEFAULT_LIQUIDATION_DISCOUNT,
    } = options;

    const since = new Date();
    since.setDate(since.getDate() - deadStockDays);
    since.setHours(0, 0, 0, 0);

    // 1. Get all active products with stock
    const products = await prisma.product.findMany({
        where: { shopId, isActive: true, currentStock: { gt: 0 } },
        select: {
            id: true,
            name: true,
            skuCode: true,
            currentStock: true,
            purchasePrice: true,
            sellingPrice: true,
            createdAt: true,
        },
    });

    // 2. Get products with recent sales
    const recentSaleItems = await prisma.dailyProductPerformance.findMany({
        where: { shopId, date: { gte: since } },
        select: { productId: true, quantitySold: true },
    });

    const recentSaleMap = new Map();
    for (const item of recentSaleItems) {
        const existing = recentSaleMap.get(item.productId) || 0;
        recentSaleMap.set(item.productId, existing + item.quantitySold);
    }

    // 3. Classify and score each product
    let totalCapitalAtRisk   = 0;
    let totalLiquidationValue = 0;
    let deadStockProducts    = [];
    let slowStockProducts    = [];

    const analyzed = products.map((p) => {
        const unitsSoldRecently  = recentSaleMap.get(p.id) || 0;
        const capitalTiedUp      = parseFloat((p.currentStock * p.purchasePrice).toFixed(2));
        const retailValue        = parseFloat((p.currentStock * p.sellingPrice).toFixed(2));
        const annualHoldingCost  = parseFloat((capitalTiedUp * holdingCostPct).toFixed(2));
        const liquidationValue   = parseFloat((capitalTiedUp * (1 - liquidationDiscount)).toFixed(2));
        const potentialProfit    = parseFloat((retailValue - capitalTiedUp).toFixed(2));
        const isDead             = unitsSoldRecently === 0;

        // Risk score: dead + high capital = higher risk
        const capitalScore    = Math.min(50, (capitalTiedUp / 5000) * 50); // 0–50 based on value
        const velocityScore   = isDead ? 50 : Math.max(0, 20 - unitsSoldRecently); // 0–50 based on inactivity
        const riskScore       = Math.round(Math.min(100, capitalScore + velocityScore));

        const result = {
            productId:        p.id,
            productName:      p.name,
            skuCode:          p.skuCode,
            currentStock:     p.currentStock,
            unitsSoldLast30d: unitsSoldRecently,
            capitalTiedUp,
            retailValue,
            potentialProfit,
            annualHoldingCost,
            liquidationValue,
            riskScore,
            isDead,
            daysInCatalog: Math.floor((Date.now() - new Date(p.createdAt)) / (1000 * 60 * 60 * 24)),
            recommendation: isDead
                ? "Consider markdown or liquidation — no sales in 30 days"
                : unitsSoldRecently < 3
                ? "Slow mover — consider promotional push or bundling"
                : "Acceptable velocity — monitor",
        };

        if (isDead) {
            totalCapitalAtRisk    += capitalTiedUp;
            totalLiquidationValue += liquidationValue;
            deadStockProducts.push(result);
        } else if (unitsSoldRecently < 5) {
            slowStockProducts.push(result);
        }

        return result;
    });

    return {
        shopId,
        summary: {
            totalProducts:        analyzed.length,
            deadStockCount:       deadStockProducts.length,
            slowStockCount:       slowStockProducts.length,
            totalCapitalAtRisk:   parseFloat(totalCapitalAtRisk.toFixed(2)),
            totalLiquidationValue: parseFloat(totalLiquidationValue.toFixed(2)),
            capitalLossIfLiquidated: parseFloat((totalCapitalAtRisk - totalLiquidationValue).toFixed(2)),
            annualHoldingCostAtRisk: parseFloat((totalCapitalAtRisk * holdingCostPct).toFixed(2)),
        },
        deadStockProducts:  deadStockProducts.sort((a, b) => b.capitalTiedUp - a.capitalTiedUp),
        slowStockProducts:  slowStockProducts.sort((a, b) => b.riskScore - a.riskScore),
        allProducts:        analyzed.sort((a, b) => b.riskScore - a.riskScore),
    };
};

/**
 * Get a concise dead stock risk summary for the AI Assistant context.
 * @param {string} shopId
 */
const getDeadStockRisk = async (shopId) => {
    const analysis = await analyzeCapitalRisk(shopId);
    return {
        summary: analysis.summary,
        deadStockProducts: analysis.deadStockProducts.slice(0, 10), // Top 10 by capital risk
    };
};

module.exports = {
    analyzeCapitalRisk,
    getDeadStockRisk,
    DEFAULT_DEAD_STOCK_DAYS,
};
