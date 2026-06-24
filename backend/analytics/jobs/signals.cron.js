const cron = require("node-cron");
const { prisma } = require("../../db/db");
const { computeAdjustedMetrics } = require("../pipelines/signalAggregator");
const Logger = require("../../utils/logger");

/**
 * External Signals Cron Job — V2.4
 *
 * Runs nightly BEFORE the trend detection cron.
 * For each active shop: fetches all external signals (weather, festival, holiday),
 * aggregates them into a composite demand factor, and persists to:
 *   - ExternalSignal (individual signals)
 *   - DailySignalAdjustedMetrics (composite per-shop-per-day)
 *
 * Schedule: 23:30 IST (29 minutes before main precompute job)
 * This ensures signal data is ready before trend detection runs at 00:00.
 */

/**
 * Run signal aggregation for all active shops.
 */
const runSignalIngestion = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    Logger.info("[SIGNALS-CRON] Starting nightly external signals ingestion...");

    try {
        const shops = await prisma.shop.findMany({
            select: { id: true, shopName: true },
        });

        let successCount = 0;
        let errorCount   = 0;

        for (const shop of shops) {
            try {
                const result = await computeAdjustedMetrics(shop.id, today, {
                    lat: process.env.DEFAULT_LAT || 19.0760,
                    lon: process.env.DEFAULT_LON || 72.8777,
                });

                Logger.info(
                    `[SIGNALS-CRON] Shop "${shop.shopName}": ` +
                    `composite=${result.compositeIntensity}, ` +
                    `signals=${result.signals?.length || 0}, ` +
                    `confidence=${result.confidenceScore}`
                );
                successCount++;
            } catch (shopErr) {
                Logger.error(`[SIGNALS-CRON] Failed for shop "${shop.shopName}": ${shopErr.message}`);
                errorCount++;
            }
        }

        Logger.info(
            `[SIGNALS-CRON] Ingestion complete — ` +
            `${successCount} shops processed, ${errorCount} errors.`
        );
    } catch (err) {
        Logger.error(`[SIGNALS-CRON] Fatal error in signal ingestion: ${err.message}`);
    }
};

/**
 * Register the signals cron job.
 * Schedule: Every day at 23:30 IST (before main precompute at 23:59).
 */
const registerSignalsCron = () => {
    cron.schedule("30 23 * * *", runSignalIngestion, {
        timezone: "Asia/Kolkata",
    });
    Logger.info("[SIGNALS-CRON] External signals ingestion job registered (runs at 23:30 IST).");
};

module.exports = { registerSignalsCron, runSignalIngestion };
