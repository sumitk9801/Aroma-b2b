const { prisma } = require("../../db/db");

/**
 * Reorder Calculator — V2.4 Forecast Engine
 *
 * Computes Economic Order Quantities (EOQ) and reorder points (ROP) using:
 *   - Current stock levels
 *   - Average daily consumption (from DailyProductPerformance)
 *   - Configurable lead time and safety stock multiplier
 *
 * Formulas:
 *   ROP (Reorder Point) = (Avg Daily Demand × Lead Time) + Safety Stock
 *   EOQ (Economic Order Qty) = sqrt((2 × Annual Demand × Order Cost) / Holding Cost)
 *   Days to Stockout = Current Stock / Avg Daily Demand
 */

const DEFAULT_LEAD_TIME_DAYS     = 3;   // Days until supplier delivers after order
const DEFAULT_SAFETY_STOCK_DAYS  = 2;   // Buffer days of safety stock
const DEFAULT_HOLDING_COST_PCT   = 0.25; // 25% of item cost per year (industry average)
const DEFAULT_ORDER_COST         = 150;  // Fixed cost per purchase order (₹)
const LOOKBACK_DAYS              = 30;   // Days of history to compute avg demand

/**
 * Calculate the average daily consumption for a product.
 * @param {string} productId
 * @returns {Promise<number>} Average units per day
 */
const getAvgDailyDemand = async (productId) => {
    const since = new Date();
    since.setDate(since.getDate() - LOOKBACK_DAYS);
    since.setHours(0, 0, 0, 0);

    const records = await prisma.dailyProductPerformance.findMany({
        where: { productId, date: { gte: since } },
        select: { quantitySold: true },
    });

    if (!records.length) return 0;

    const totalUnits = records.reduce((sum, r) => sum + r.quantitySold, 0);
    return parseFloat((totalUnits / LOOKBACK_DAYS).toFixed(4));
};

/**
 * Calculate reorder metrics for a single product.
 *
 * @param {string} productId
 * @param {Object} [options]
 * @param {number} [options.leadTimeDays]
 * @param {number} [options.safetyStockDays]
 * @param {number} [options.holdingCostPct]
 * @param {number} [options.orderCost]
 * @returns {Promise<Object>}
 */
const calculateReorderMetrics = async (productId, options = {}) => {
    const {
        leadTimeDays    = DEFAULT_LEAD_TIME_DAYS,
        safetyStockDays = DEFAULT_SAFETY_STOCK_DAYS,
        holdingCostPct  = DEFAULT_HOLDING_COST_PCT,
        orderCost       = DEFAULT_ORDER_COST,
    } = options;

    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
            id: true,
            name: true,
            skuCode: true,
            currentStock: true,
            minimumStock: true,
            purchasePrice: true,
        },
    });

    if (!product) throw new Error(`Product not found: ${productId}`);

    const avgDailyDemand = await getAvgDailyDemand(productId);

    // Core calculations
    const safetyStock    = parseFloat((avgDailyDemand * safetyStockDays).toFixed(2));
    const reorderPoint   = parseFloat((avgDailyDemand * leadTimeDays + safetyStock).toFixed(2));
    const daysToStockout = avgDailyDemand > 0
        ? parseFloat((product.currentStock / avgDailyDemand).toFixed(1))
        : null; // null means no recent demand

    // EOQ formula: sqrt((2 × D × S) / (H × C))
    // D = Annual demand, S = Order cost, H = Holding cost %, C = unit cost
    const annualDemand  = avgDailyDemand * 365;
    const holdingCost   = holdingCostPct * product.purchasePrice;
    const eoq = holdingCost > 0
        ? parseFloat(Math.sqrt((2 * annualDemand * orderCost) / holdingCost).toFixed(2))
        : Math.max(product.minimumStock * 2, 10);

    // Risk classification
    const needsReorder    = product.currentStock <= reorderPoint;
    const isCritical      = daysToStockout !== null && daysToStockout <= leadTimeDays;
    const isAtRisk        = daysToStockout !== null && daysToStockout <= leadTimeDays + safetyStockDays;

    return {
        productId:      product.id,
        productName:    product.name,
        skuCode:        product.skuCode,
        currentStock:   product.currentStock,
        minimumStock:   product.minimumStock,
        avgDailyDemand,
        safetyStock,
        reorderPoint,
        economicOrderQty:  eoq,
        recommendedOrderQty: needsReorder ? Math.max(eoq, reorderPoint - product.currentStock + safetyStock) : 0,
        daysToStockout,
        needsReorder,
        isCritical,
        isAtRisk,
        leadTimeDays,
        estimatedOrderCost: parseFloat((eoq * product.purchasePrice).toFixed(2)),
    };
};

/**
 * Calculate reorder metrics for all active products in a shop.
 * Returns only products that need reordering or are at risk.
 *
 * @param {string} shopId
 * @param {boolean} [onlyAtRisk=false] - If true, returns only products needing action.
 * @returns {Promise<Array>}
 */
const getShopReorderMetrics = async (shopId, onlyAtRisk = false) => {
    const products = await prisma.product.findMany({
        where: { shopId, isActive: true },
        select: { id: true },
    });

    const metrics = await Promise.all(
        products.map((p) => calculateReorderMetrics(p.id))
    );

    const result = onlyAtRisk
        ? metrics.filter((m) => m.needsReorder || m.isCritical || m.isAtRisk)
        : metrics;

    // Sort: critical first, then by days to stockout ascending
    return result.sort((a, b) => {
        if (a.isCritical && !b.isCritical) return -1;
        if (!a.isCritical && b.isCritical) return  1;
        if (a.daysToStockout === null) return  1;
        if (b.daysToStockout === null) return -1;
        return a.daysToStockout - b.daysToStockout;
    });
};

module.exports = {
    calculateReorderMetrics,
    getShopReorderMetrics,
    getAvgDailyDemand,
    DEFAULT_LEAD_TIME_DAYS,
    DEFAULT_SAFETY_STOCK_DAYS,
};
