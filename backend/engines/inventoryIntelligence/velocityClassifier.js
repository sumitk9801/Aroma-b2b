const { prisma } = require("../../db/db");

/**
 * Velocity Classifier — Inventory Intelligence Engine
 *
 * Classifies products into ABC movement tiers based on sales velocity
 * using data from DailyProductPerformance and ProductTrendScore tables.
 *
 * Classification tiers:
 *   A — Fast Movers:  Top 20% by revenue contribution
 *   B — Medium Movers: Next 30% by revenue contribution
 *   C — Slow Movers:  Remaining 50%
 *   D — Dead Stock:   Zero sales in the past 30 days
 */

const VELOCITY_CLASSES = {
    A: "A", // Fast mover
    B: "B", // Medium mover
    C: "C", // Slow mover
    D: "D", // Dead stock
};

const VELOCITY_LABELS = {
    A: "Fast Mover",
    B: "Medium Mover",
    C: "Slow Mover",
    D: "Dead Stock",
};

const DEAD_STOCK_DAYS = 30; // Days with no sales = dead stock

/**
 * Classify all active products in a shop using ABC analysis.
 *
 * @param {string} shopId
 * @returns {Promise<Array>}
 */
const classifyProductVelocity = async (shopId) => {
    const since = new Date();
    since.setDate(since.getDate() - DEAD_STOCK_DAYS);
    since.setHours(0, 0, 0, 0);

    // 1. Get all active products
    const products = await prisma.product.findMany({
        where: { shopId, isActive: true },
        select: {
            id: true,
            name: true,
            skuCode: true,
            currentStock: true,
            purchasePrice: true,
            sellingPrice: true,
        },
    });

    // 2. Get revenue per product for last 30 days
    const perfRecords = await prisma.dailyProductPerformance.groupBy({
        by: ["productId"],
        where: {
            shopId,
            date: { gte: since },
        },
        _sum: { revenue: true, quantitySold: true },
    });

    const perfMap = new Map(
        perfRecords.map((r) => [
            r.productId,
            {
                revenue:      r._sum.revenue      || 0,
                quantitySold: r._sum.quantitySold || 0,
            },
        ])
    );

    // 3. Enrich products with performance data
    const enriched = products.map((p) => {
        const perf = perfMap.get(p.id) || { revenue: 0, quantitySold: 0 };
        return {
            productId:    p.id,
            productName:  p.name,
            skuCode:      p.skuCode,
            currentStock: p.currentStock,
            purchasePrice: p.purchasePrice,
            sellingPrice:  p.sellingPrice,
            revenue30d:   parseFloat(perf.revenue.toFixed(2)),
            unitsSold30d: perf.quantitySold,
        };
    });

    // 4. Separate dead stock (zero sales in 30d)
    const active = enriched.filter((p) => p.unitsSold30d > 0);
    const dead   = enriched.filter((p) => p.unitsSold30d === 0);

    // 5. ABC classification on active products by revenue
    const totalRevenue = active.reduce((sum, p) => sum + p.revenue30d, 0);
    let cumulativeRevenue = 0;

    const sortedActive = [...active].sort((a, b) => b.revenue30d - a.revenue30d);

    const classified = sortedActive.map((p) => {
        cumulativeRevenue += p.revenue30d;
        const cumulativePct = totalRevenue > 0 ? (cumulativeRevenue / totalRevenue) * 100 : 100;

        let velocityClass, velocityLabel;
        if (cumulativePct <= 70) {
            velocityClass = VELOCITY_CLASSES.A;
            velocityLabel = VELOCITY_LABELS.A;
        } else if (cumulativePct <= 90) {
            velocityClass = VELOCITY_CLASSES.B;
            velocityLabel = VELOCITY_LABELS.B;
        } else {
            velocityClass = VELOCITY_CLASSES.C;
            velocityLabel = VELOCITY_LABELS.C;
        }

        return {
            ...p,
            velocityClass,
            velocityLabel,
            revenueContributionPct: totalRevenue > 0
                ? parseFloat(((p.revenue30d / totalRevenue) * 100).toFixed(2))
                : 0,
        };
    });

    // 6. Tag dead stock products
    const deadClassified = dead.map((p) => ({
        ...p,
        velocityClass:           VELOCITY_CLASSES.D,
        velocityLabel:           VELOCITY_LABELS.D,
        revenueContributionPct:  0,
    }));

    return [...classified, ...deadClassified];
};

/**
 * Get only slow-moving (C-class) and dead stock (D-class) products.
 * Used by AI Assistant for "What are my slow-moving products?" intent.
 * @param {string} shopId
 */
const getSlowAndDeadMovers = async (shopId) => {
    const all = await classifyProductVelocity(shopId);
    return all.filter((p) => p.velocityClass === "C" || p.velocityClass === "D");
};

/**
 * Get fast-moving (A-class) products.
 * @param {string} shopId
 */
const getFastMovers = async (shopId) => {
    const all = await classifyProductVelocity(shopId);
    return all.filter((p) => p.velocityClass === "A");
};

/**
 * Get velocity summary counts per class for a shop.
 * @param {string} shopId
 */
const getVelocitySummary = async (shopId) => {
    const all = await classifyProductVelocity(shopId);
    const summary = { A: 0, B: 0, C: 0, D: 0 };
    all.forEach((p) => { summary[p.velocityClass]++; });
    return {
        total: all.length,
        fastMovers:   summary.A,
        mediumMovers: summary.B,
        slowMovers:   summary.C,
        deadStock:    summary.D,
        classification: all,
    };
};

module.exports = {
    classifyProductVelocity,
    getSlowAndDeadMovers,
    getFastMovers,
    getVelocitySummary,
    VELOCITY_CLASSES,
    VELOCITY_LABELS,
};
