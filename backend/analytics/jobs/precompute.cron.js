const cron = require("node-cron");
const { prisma } = require("../../db/db");
const Logger = require("../../utils/logger");

/**
 * Precompute and freeze daily metrics for all active shops.
 * Runs at 11:59 PM every night.
 * Populates DailyShopMetrics and DailyProductPerformance tables.
 * These tables power fast historical queries and future AI model training.
 */
const runDailyPrecomputation = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateKey = today; // frozen date reference

    Logger.info("[CRON] Starting nightly precomputation job...");

    try {
        const shops = await prisma.shop.findMany({ select: { id: true, shopName: true } });

        for (const shop of shops) {
            const shopId = shop.id;

            // ─── DailyShopMetrics ────────────────────────────────────────────
            const [salesAgg, purchasesAgg, damageAgg, newCustomers] = await Promise.all([
                prisma.sale.aggregate({
                    where: { shopId, createdAt: { gte: today, lt: tomorrow } },
                    _count: { id: true },
                    _sum: { totalAmount: true }
                }),
                prisma.purchase.aggregate({
                    where: { shopId, createdAt: { gte: today, lt: tomorrow } },
                    _count: { id: true },
                    _sum: { totalAmount: true }
                }),
                prisma.damagedStock.aggregate({
                    where: { shopId, createdAt: { gte: today, lt: tomorrow } },
                    _sum: { valueLost: true }
                }),
                prisma.customer.count({
                    where: { shopId, createdAt: { gte: today, lt: tomorrow } }
                })
            ]);

            // Calculate COGS from today's sale items
            const todaySaleItems = await prisma.saleItem.findMany({
                where: { sale: { shopId, createdAt: { gte: today, lt: tomorrow } } },
                select: { quantity: true, product: { select: { purchasePrice: true } } }
            });
            const cogs = todaySaleItems.reduce((acc, item) => acc + item.quantity * (item.product?.purchasePrice || 0), 0);
            const revenue = salesAgg._sum.totalAmount || 0;
            const netProfit = revenue - cogs;
            const grossMargin = revenue > 0 ? parseFloat(((netProfit / revenue) * 100).toFixed(2)) : 0;

            await prisma.dailyShopMetrics.upsert({
                where: { shopId_date: { shopId, date: dateKey } },
                create: {
                    shopId,
                    date: dateKey,
                    totalSalesCount: salesAgg._count.id || 0,
                    totalRevenue: parseFloat(revenue.toFixed(2)),
                    costOfGoodsSold: parseFloat(cogs.toFixed(2)),
                    netProfit: parseFloat(netProfit.toFixed(2)),
                    grossMargin,
                    totalPurchases: purchasesAgg._count.id || 0,
                    purchaseExpenses: parseFloat((purchasesAgg._sum.totalAmount || 0).toFixed(2)),
                    totalDamageValue: parseFloat((damageAgg._sum.valueLost || 0).toFixed(2)),
                    newCustomers
                },
                update: {
                    totalSalesCount: salesAgg._count.id || 0,
                    totalRevenue: parseFloat(revenue.toFixed(2)),
                    costOfGoodsSold: parseFloat(cogs.toFixed(2)),
                    netProfit: parseFloat(netProfit.toFixed(2)),
                    grossMargin,
                    totalPurchases: purchasesAgg._count.id || 0,
                    purchaseExpenses: parseFloat((purchasesAgg._sum.totalAmount || 0).toFixed(2)),
                    totalDamageValue: parseFloat((damageAgg._sum.valueLost || 0).toFixed(2)),
                    newCustomers
                }
            });

            // ─── DailyProductPerformance ──────────────────────────────────────
            const productAggs = await prisma.saleItem.groupBy({
                by: ["productId"],
                where: { sale: { shopId, createdAt: { gte: today, lt: tomorrow } } },
                _sum: { quantity: true, subtotal: true },
                _count: { id: true }
            });

            for (const agg of productAggs) {
                await prisma.dailyProductPerformance.upsert({
                    where: { productId_date: { productId: agg.productId, date: dateKey } },
                    create: {
                        productId: agg.productId,
                        shopId,
                        date: dateKey,
                        quantitySold: agg._sum.quantity || 0,
                        revenue: parseFloat((agg._sum.subtotal || 0).toFixed(2)),
                        unitsSold: agg._count.id || 0
                    },
                    update: {
                        quantitySold: agg._sum.quantity || 0,
                        revenue: parseFloat((agg._sum.subtotal || 0).toFixed(2)),
                        unitsSold: agg._count.id || 0
                    }
                });
            }

            Logger.info(`[CRON] Precomputed metrics for shop: ${shop.shopName}`);
        }

        Logger.info("[CRON] Nightly precomputation complete.");
    } catch (err) {
        Logger.error(`[CRON] Precomputation failed: ${err.message}`);
    }
};

/**
 * Register the cron job.
 * Schedule: Every day at 11:59 PM.
 */
const registerDailyCron = () => {
    cron.schedule("59 23 * * *", runDailyPrecomputation, {
        timezone: "Asia/Kolkata" // Adjust to business timezone
    });
    Logger.info("[CRON] Daily precomputation job registered (runs at 23:59 IST).");
};

module.exports = { registerDailyCron, runDailyPrecomputation };
