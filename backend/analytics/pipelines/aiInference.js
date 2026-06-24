const { prisma } = require("../../db/db");

/**
 * AI Inference Pipeline — Analytics Layer
 *
 * Formats precomputed analytical data into standard sequential JSON arrays
 * ready for ingestion by forecasting models (ARIMA, Prophet, TensorFlow, etc.)
 * or for feeding into the AI Business Assistant's context builder.
 *
 * All outputs are read-only views of the analytical dataset.
 * Nothing in this file modifies the inventory database.
 */

/**
 * Export daily revenue time series for a shop (AI forecasting format).
 * @param {string} shopId
 * @param {number} [days=90] - Number of historical days
 * @returns {Promise<Array<{date: string, revenue: number, cogs: number, netProfit: number}>>}
 */
const getDailyRevenueSeries = async (shopId, days = 90) => {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const metrics = await prisma.dailyShopMetrics.findMany({
        where:   { shopId, date: { gte: since } },
        orderBy: { date: "asc" },
        select:  { date: true, totalRevenue: true, costOfGoodsSold: true, netProfit: true, totalSalesCount: true },
    });

    return metrics.map((m) => ({
        date:            m.date.toISOString().split("T")[0],
        revenue:         m.totalRevenue,
        cogs:            m.costOfGoodsSold,
        netProfit:       m.netProfit,
        totalSalesCount: m.totalSalesCount,
    }));
};

/**
 * Export per-product daily sales time series (AI training format).
 * @param {string} productId
 * @param {number} [days=90]
 * @returns {Promise<Array<{date: string, quantitySold: number, revenue: number}>>}
 */
const getProductDailySeries = async (productId, days = 90) => {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const records = await prisma.dailyProductPerformance.findMany({
        where:   { productId, date: { gte: since } },
        orderBy: { date: "asc" },
        select:  { date: true, quantitySold: true, revenue: true, unitsSold: true },
    });

    return records.map((r) => ({
        date:         r.date.toISOString().split("T")[0],
        quantitySold: r.quantitySold,
        revenue:      r.revenue,
        unitsSold:    r.unitsSold,
    }));
};

/**
 * Export signal-adjusted revenue series for ML training.
 * Combines base revenue with external signal factors.
 * @param {string} shopId
 * @param {number} [days=90]
 */
const getSignalAdjustedSeries = async (shopId, days = 90) => {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const records = await prisma.dailySignalAdjustedMetrics.findMany({
        where:   { shopId, date: { gte: since } },
        orderBy: { date: "asc" },
        select:  { date: true, baseRevenue: true, adjustedRevenue: true, signalFactors: true, confidenceScore: true },
    }).catch(() => []); // Graceful fallback if table empty

    return records.map((r) => ({
        date:            r.date.toISOString().split("T")[0],
        baseRevenue:     r.baseRevenue,
        adjustedRevenue: r.adjustedRevenue,
        signalFactors:   r.signalFactors,
        confidenceScore: r.confidenceScore,
    }));
};

/**
 * Export trend scores for all products in a shop.
 * @param {string} shopId
 */
const getProductTrendSeries = async (shopId) => {
    const scores = await prisma.productTrendScore.findMany({
        where:   { shopId },
        orderBy: { opportunityScore: "desc" },
        include: { product: { select: { name: true, skuCode: true } } },
    }).catch(() => []);

    return scores.map((s) => ({
        productId:        s.productId,
        productName:      s.product?.name || "Unknown",
        skuCode:          s.product?.skuCode || "N/A",
        trendScore:       s.trendScore,
        trendLabel:       s.trendLabel,
        velocityLast7d:   s.velocityLast7d,
        velocityPrior14d: s.velocityPrior14d,
        revenueVelocity:  s.revenueVelocity,
        opportunityScore: s.opportunityScore,
        computedAt:       s.computedAt?.toISOString() || null,
    }));
};

module.exports = {
    getDailyRevenueSeries,
    getProductDailySeries,
    getSignalAdjustedSeries,
    getProductTrendSeries,
};
