const { prisma } = require("../../db/db");
const Logger = require("../../utils/logger");

/**
 * Trend Detector Pipeline — V2.5 Trend Detection Engine
 *
 * Computes rolling velocity trend scores for all active products using
 * DailyProductPerformance data. Results are persisted to ProductTrendScore.
 *
 * Algorithm: Rolling Velocity Comparison
 *   trendScore = avgUnits_last7d / avgUnits_prior14d
 *
 *   trendScore ≥ 1.3  → TRENDING_UP   (emerging opportunity, +30% velocity)
 *   trendScore ≥ 1.1  → GROWING       (positive momentum, +10-29%)
 *   trendScore ~1.0   → STABLE        (consistent velocity, ±10%)
 *   trendScore < 0.8  → DECLINING     (losing velocity, -20%+)
 *   trendScore < 0.5  → AT_RISK       (severe decline or near-zero, consider action)
 *
 * Opportunity Score (0–100) factors:
 *   - Trend velocity ratio
 *   - Revenue trajectory
 *   - Absolute sales volume
 */

const TREND_THRESHOLDS = {
    TRENDING_UP: 1.3,
    GROWING:     1.1,
    STABLE_HIGH: 1.1,  // Upper bound of STABLE
    STABLE_LOW:  0.9,  // Lower bound of STABLE
    DECLINING:   0.8,
    AT_RISK:     0.5,
};

const TREND_LABELS = {
    TRENDING_UP: "TRENDING_UP",
    GROWING:     "GROWING",
    STABLE:      "STABLE",
    DECLINING:   "DECLINING",
    AT_RISK:     "AT_RISK",
};

/**
 * Classify a trend score into a trend label.
 * @param {number} score
 * @returns {string}
 */
const classifyTrend = (score) => {
    if (score >= TREND_THRESHOLDS.TRENDING_UP) return TREND_LABELS.TRENDING_UP;
    if (score >= TREND_THRESHOLDS.GROWING)     return TREND_LABELS.GROWING;
    if (score >= TREND_THRESHOLDS.DECLINING)   return TREND_LABELS.STABLE;
    if (score >= TREND_THRESHOLDS.AT_RISK)     return TREND_LABELS.DECLINING;
    return TREND_LABELS.AT_RISK;
};

/**
 * Compute opportunity score (0–100) for a product.
 * @param {number} trendScore     - Velocity ratio
 * @param {number} velocity7d     - Avg units/day last 7 days
 * @param {number} revenueVelocity - Avg revenue/day last 7 days
 * @returns {number}
 */
const computeOpportunityScore = (trendScore, velocity7d, revenueVelocity) => {
    // Trend component (0–60)
    const trendComponent = Math.min(60, Math.max(0,
        trendScore >= 1.3 ? 55 + (trendScore - 1.3) * 50 :
        trendScore >= 1.1 ? 35 + (trendScore - 1.1) * 100 :
        trendScore >= 0.9 ? 20 :
        Math.max(0, 20 - (1 - trendScore) * 50)
    ));

    // Volume component (0–25) — absolute velocity matters too
    const volumeComponent = Math.min(25, velocity7d * 2);

    // Revenue component (0–15) — revenue growth signal
    const revenueComponent = Math.min(15, revenueVelocity / 100);

    return Math.round(Math.min(100, trendComponent + volumeComponent + revenueComponent));
};

/**
 * Run the full trend detection pipeline for a single shop.
 * Updates ProductTrendScore records for all active products.
 *
 * @param {string} shopId
 * @returns {Promise<{processed: number, trending: number, declining: number, atRisk: number}>}
 */
const runTrendDetection = async (shopId) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const day7Start = new Date(now);
    day7Start.setDate(day7Start.getDate() - 7);

    const day21Start = new Date(now);
    day21Start.setDate(day21Start.getDate() - 21);

    const products = await prisma.product.findMany({
        where: { shopId, isActive: true },
        select: { id: true, name: true },
    });

    let processed = 0, trending = 0, declining = 0, atRisk = 0;

    for (const product of products) {
        try {
            // Last 7 days performance
            const last7d = await prisma.dailyProductPerformance.aggregate({
                where: {
                    productId: product.id,
                    shopId,
                    date: { gte: day7Start, lt: now },
                },
                _sum:   { quantitySold: true, revenue: true },
                _count: { id: true },
            });

            // Prior 14 days (7–21 days ago)
            const prior14d = await prisma.dailyProductPerformance.aggregate({
                where: {
                    productId: product.id,
                    shopId,
                    date: { gte: day21Start, lt: day7Start },
                },
                _sum:   { quantitySold: true, revenue: true },
                _count: { id: true },
            });

            const unitsLast7      = last7d._sum.quantitySold  || 0;
            const unitsPrior14    = prior14d._sum.quantitySold || 0;
            const revenueLast7    = last7d._sum.revenue        || 0;

            const velocityLast7d   = parseFloat((unitsLast7  / 7).toFixed(4));
            const velocityPrior14d = parseFloat((unitsPrior14 / 14).toFixed(4));
            const revenueVelocity  = parseFloat((revenueLast7  / 7).toFixed(4));

            // Trend score: ratio of recent velocity to prior velocity
            // If prior velocity is 0 but recent is > 0, it's a new trending product
            let trendScore;
            if (velocityPrior14d === 0 && velocityLast7d > 0) {
                trendScore = 1.5; // New or resurrected product with demand
            } else if (velocityPrior14d === 0 && velocityLast7d === 0) {
                trendScore = 1.0; // No movement either period → stable (dead)
            } else {
                trendScore = parseFloat((velocityLast7d / velocityPrior14d).toFixed(4));
            }

            const trendLabel     = classifyTrend(trendScore);
            const opportunityScore = computeOpportunityScore(trendScore, velocityLast7d, revenueVelocity);

            // Upsert trend score
            await prisma.productTrendScore.upsert({
                where:  { productId_shopId: { productId: product.id, shopId } },
                create: {
                    productId: product.id,
                    shopId,
                    trendScore,
                    trendLabel,
                    velocityLast7d,
                    velocityPrior14d,
                    revenueVelocity,
                    opportunityScore,
                },
                update: {
                    trendScore,
                    trendLabel,
                    velocityLast7d,
                    velocityPrior14d,
                    revenueVelocity,
                    opportunityScore,
                    computedAt: new Date(),
                },
            });

            processed++;
            if (trendLabel === TREND_LABELS.TRENDING_UP || trendLabel === TREND_LABELS.GROWING) trending++;
            if (trendLabel === TREND_LABELS.DECLINING) declining++;
            if (trendLabel === TREND_LABELS.AT_RISK)   atRisk++;

        } catch (err) {
            Logger.error(`[TrendDetector] Failed to score product ${product.id}: ${err.message}`);
        }
    }

    Logger.info(`[TrendDetector] Shop ${shopId}: processed=${processed}, trending=${trending}, declining=${declining}, atRisk=${atRisk}`);
    return { processed, trending, declining, atRisk };
};

/**
 * Get current trend scores for a shop from the database.
 * @param {string} shopId
 * @param {string} [filterLabel] - Optional: "TRENDING_UP" | "GROWING" | "STABLE" | "DECLINING" | "AT_RISK"
 */
const getStoredTrends = async (shopId, filterLabel = null) => {
    const where = { shopId };
    if (filterLabel) where.trendLabel = filterLabel;

    const scores = await prisma.productTrendScore.findMany({
        where,
        include: { product: { select: { name: true, skuCode: true, currentStock: true } } },
        orderBy: { opportunityScore: "desc" },
    });

    return scores.map((s) => ({
        productId:        s.productId,
        productName:      s.product?.name || "Unknown",
        skuCode:          s.product?.skuCode || "N/A",
        currentStock:     s.product?.currentStock || 0,
        trendScore:       s.trendScore,
        trendLabel:       s.trendLabel,
        velocityLast7d:   s.velocityLast7d,
        velocityPrior14d: s.velocityPrior14d,
        revenueVelocity:  s.revenueVelocity,
        opportunityScore: s.opportunityScore,
        computedAt:       s.computedAt,
    }));
};

module.exports = {
    runTrendDetection,
    getStoredTrends,
    classifyTrend,
    TREND_THRESHOLDS,
    TREND_LABELS,
};
