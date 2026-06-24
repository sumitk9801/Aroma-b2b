const cron = require("node-cron");
const { prisma } = require("../../db/db");
const { runTrendDetection } = require("../pipelines/trendDetector");
const Logger = require("../../utils/logger");

/**
 * Trend Detection Cron Job — V2.5
 *
 * Runs nightly AFTER the main precompute job has frozen daily metrics.
 * For each active shop: runs the trend detection pipeline which computes
 * rolling velocity scores and opportunity scores for all active products.
 * Results are persisted to ProductTrendScore table.
 *
 * Pipeline dependency order:
 *   23:30 → signals.cron.js   (External signals ingestion)
 *   23:59 → precompute.cron.js (DailyShopMetrics + DailyProductPerformance)
 *   00:15 → trends.cron.js    (Trend scores — reads from yesterday's frozen data)
 *
 * Schedule: 00:15 IST (next day, after precompute completes)
 */

/**
 * Run trend detection for all active shops.
 */
const runTrendDetectionAllShops = async () => {
    Logger.info("[TRENDS-CRON] Starting nightly trend detection pipeline...");

    try {
        const shops = await prisma.shop.findMany({
            select: { id: true, shopName: true },
        });

        let totalProcessed = 0;
        let totalTrending  = 0;
        let totalDeclining = 0;
        let totalAtRisk    = 0;

        for (const shop of shops) {
            try {
                const result = await runTrendDetection(shop.id);

                Logger.info(
                    `[TRENDS-CRON] Shop "${shop.shopName}": ` +
                    `processed=${result.processed}, ` +
                    `trending=${result.trending}, ` +
                    `declining=${result.declining}, ` +
                    `atRisk=${result.atRisk}`
                );

                totalProcessed += result.processed;
                totalTrending  += result.trending;
                totalDeclining += result.declining;
                totalAtRisk    += result.atRisk;
            } catch (shopErr) {
                Logger.error(`[TRENDS-CRON] Failed for shop "${shop.shopName}": ${shopErr.message}`);
            }
        }

        Logger.info(
            `[TRENDS-CRON] Trend detection complete — ` +
            `${totalProcessed} products scored across ${shops.length} shops. ` +
            `Trending: ${totalTrending}, Declining: ${totalDeclining}, At Risk: ${totalAtRisk}.`
        );
    } catch (err) {
        Logger.error(`[TRENDS-CRON] Fatal error in trend detection: ${err.message}`);
    }
};

/**
 * Register the trends cron job.
 * Schedule: Every day at 00:15 IST (after precompute finishes at 23:59).
 */
const registerTrendsCron = () => {
    cron.schedule("15 0 * * *", runTrendDetectionAllShops, {
        timezone: "Asia/Kolkata",
    });
    Logger.info("[TRENDS-CRON] Trend detection job registered (runs at 00:15 IST).");
};

module.exports = { registerTrendsCron, runTrendDetectionAllShops };
