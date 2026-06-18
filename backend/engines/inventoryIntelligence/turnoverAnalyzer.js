const { prisma } = require("../../db/db");

/**
 * Turnover Analyzer — Inventory Intelligence Engine
 *
 * Computes Inventory Turnover Ratio and Days Inventory Outstanding (DIO)
 * using precomputed DailyShopMetrics data where available, falling back
 * to live SaleItem queries for accuracy.
 *
 * Inventory Turnover Ratio = COGS / Average Inventory Value
 * Days Inventory Outstanding (DIO) = 365 / Turnover Ratio
 *
 * Industry benchmarks for retail/wholesale:
 *   Excellent:  ≥ 6
 *   Good:       4–5.9
 *   Average:    2–3.9
 *   Poor:       < 2
 */

const BENCHMARK_THRESHOLDS = {
    EXCELLENT: 6,
    GOOD:      4,
    AVERAGE:   2,
};

/**
 * Get industry benchmark label for a turnover ratio.
 * @param {number} ratio
 * @returns {string}
 */
const getBenchmarkLabel = (ratio) => {
    if (ratio >= BENCHMARK_THRESHOLDS.EXCELLENT) return "Excellent";
    if (ratio >= BENCHMARK_THRESHOLDS.GOOD)      return "Good";
    if (ratio >= BENCHMARK_THRESHOLDS.AVERAGE)   return "Average";
    return "Poor — consider promotions or markdowns";
};

/**
 * Calculate turnover ratio for a shop using the last N days of data.
 *
 * @param {string} shopId
 * @param {number} [days=30] - Analysis window in days
 * @returns {Promise<Object>}
 */
const calculateTurnoverRatio = async (shopId, days = 30) => {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    // 1. Use precomputed DailyShopMetrics for COGS (fast path)
    const metricsAggregate = await prisma.dailyShopMetrics.aggregate({
        where: { shopId, date: { gte: since } },
        _sum: { costOfGoodsSold: true, totalRevenue: true, netProfit: true },
    });

    const cogs    = metricsAggregate._sum.costOfGoodsSold || 0;
    const revenue = metricsAggregate._sum.totalRevenue    || 0;

    // 2. Current inventory value (live query — always accurate)
    const products = await prisma.product.findMany({
        where: { shopId, isActive: true },
        select: { currentStock: true, purchasePrice: true, sellingPrice: true },
    });

    const currentInventoryCost   = products.reduce((sum, p) => sum + p.currentStock * p.purchasePrice, 0);
    const currentInventoryRetail = products.reduce((sum, p) => sum + p.currentStock * p.sellingPrice,  0);
    const totalProductCount      = products.length;

    // 3. Turnover calculation
    const turnoverRatio = currentInventoryCost > 0
        ? parseFloat((cogs / currentInventoryCost).toFixed(2))
        : 0;

    const daysInventoryOutstanding = turnoverRatio > 0
        ? parseFloat((365 / turnoverRatio).toFixed(1))
        : null;

    // 4. Annualized projection
    const annualizedTurnover = days > 0
        ? parseFloat(((cogs / days) * 365 / (currentInventoryCost || 1)).toFixed(2))
        : 0;

    return {
        shopId,
        analysisDays:            days,
        cogs:                    parseFloat(cogs.toFixed(2)),
        revenue:                 parseFloat(revenue.toFixed(2)),
        currentInventoryCost:    parseFloat(currentInventoryCost.toFixed(2)),
        currentInventoryRetail:  parseFloat(currentInventoryRetail.toFixed(2)),
        totalProductCount,
        turnoverRatio,
        annualizedTurnover,
        daysInventoryOutstanding,
        benchmarkLabel:          getBenchmarkLabel(annualizedTurnover),
        interpretation:          annualizedTurnover < 2
            ? "Inventory is moving slowly — review slow movers and consider promotions"
            : annualizedTurnover >= 6
            ? "Excellent inventory efficiency — stock is converting to revenue rapidly"
            : "Inventory is turning at a healthy pace",
    };
};

/**
 * Get per-product turnover contribution for a shop.
 * Identifies which products are dragging turnover down.
 *
 * @param {string} shopId
 * @param {number} [days=30]
 * @returns {Promise<Array>}
 */
const getProductTurnoverBreakdown = async (shopId, days = 30) => {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    // Per-product COGS from precomputed performance
    const perfData = await prisma.dailyProductPerformance.groupBy({
        by: ["productId"],
        where: { shopId, date: { gte: since } },
        _sum: { quantitySold: true, revenue: true },
    });

    const productIds = perfData.map((p) => p.productId);

    const products = await prisma.product.findMany({
        where: { id: { in: productIds }, isActive: true },
        select: { id: true, name: true, skuCode: true, currentStock: true, purchasePrice: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    return perfData
        .map((agg) => {
            const product  = productMap.get(agg.productId);
            if (!product) return null;

            const inventoryValue = product.currentStock * product.purchasePrice;
            const productTurnover = inventoryValue > 0
                ? parseFloat(((agg._sum.revenue || 0) / inventoryValue).toFixed(2))
                : 0;

            return {
                productId:      product.id,
                productName:    product.name,
                skuCode:        product.skuCode,
                currentStock:   product.currentStock,
                inventoryValue: parseFloat(inventoryValue.toFixed(2)),
                revenue30d:     parseFloat((agg._sum.revenue || 0).toFixed(2)),
                unitsSold30d:   agg._sum.quantitySold || 0,
                productTurnover,
                benchmarkLabel: getBenchmarkLabel(productTurnover * (365 / days)),
            };
        })
        .filter(Boolean)
        .sort((a, b) => b.revenue30d - a.revenue30d);
};

module.exports = {
    calculateTurnoverRatio,
    getProductTurnoverBreakdown,
    getBenchmarkLabel,
    BENCHMARK_THRESHOLDS,
};
