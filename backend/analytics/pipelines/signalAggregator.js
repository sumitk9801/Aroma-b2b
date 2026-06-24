const { prisma } = require("../../db/db");
const weatherAdapter         = require("../adapters/weatherAdapter");
const festivalCalendarAdapter = require("../adapters/festivalCalendarAdapter");
const holidayAdapter         = require("../adapters/holidayAdapter");
const Logger = require("../../utils/logger");

/**
 * Signal Aggregator — V2.4 Analytics Pipeline
 *
 * Merges all external signal sources (weather, festival, holiday) into
 * a single composite demand adjustment factor for a shop on a given date.
 *
 * Aggregation rules:
 *   - Multiple signals on the same day are combined using weighted average
 *   - Festival signals take priority over weather signals (higher weight)
 *   - Composite intensity is capped at 2.0 and floored at 0.5
 *   - Confidence score reflects the number and quality of signals
 */

const SIGNAL_WEIGHTS = {
    FESTIVAL:    0.50, // Highest priority — cultural demand drivers
    HOLIDAY:     0.30, // Medium priority — business closure patterns
    WEATHER:     0.20, // Lowest priority — weather impact modifier
    LOCAL_EVENT: 0.40, // Future V2.4+ signal type
    SEASONAL:    0.25, // Future V2.4+ signal type
};

const INTENSITY_CAP   = 2.0;
const INTENSITY_FLOOR = 0.5;

/**
 * Aggregate all external signals for a shop on a given date.
 * Writes results to ExternalSignal and DailySignalAdjustedMetrics tables.
 *
 * @param {string} shopId
 * @param {Date}   date
 * @param {Object} [shopConfig] - Optional: { lat, lon } for weather API
 * @returns {Promise<{compositeIntensity: number, signals: Array, confidence: number}>}
 */
const aggregateSignals = async (shopId, date, shopConfig = {}) => {
    const { lat = 19.0760, lon = 72.8777 } = shopConfig; // Default: Mumbai

    // 1. Fetch all signals in parallel
    const [weatherSignals, festivalSignals, holidaySignals] = await Promise.all([
        weatherAdapter.fetchSignals({ shopId, lat, lon, date }),
        Promise.resolve(festivalCalendarAdapter.fetchSignals({ shopId, date })),
        Promise.resolve(holidayAdapter.fetchSignals({ shopId, date })),
    ]);

    const allSignals = [
        ...weatherSignals.map((s) => ({ ...s, weight: SIGNAL_WEIGHTS.WEATHER })),
        ...festivalSignals.map((s) => ({ ...s, weight: SIGNAL_WEIGHTS[s.signalType] || SIGNAL_WEIGHTS.FESTIVAL })),
        ...holidaySignals.map((s) => ({ ...s, weight: SIGNAL_WEIGHTS.HOLIDAY })),
    ];

    // 2. Compute weighted composite intensity
    let compositeIntensity = 1.0;
    let totalWeight        = 0;
    let weightedSum        = 0;

    for (const signal of allSignals) {
        weightedSum  += signal.intensity * signal.weight;
        totalWeight  += signal.weight;
    }

    if (totalWeight > 0) {
        compositeIntensity = weightedSum / totalWeight;
    }

    // Clamp to safe range
    compositeIntensity = parseFloat(
        Math.min(INTENSITY_CAP, Math.max(INTENSITY_FLOOR, compositeIntensity)).toFixed(4)
    );

    // 3. Confidence score — more diverse signals = higher confidence
    const signalTypeCount  = new Set(allSignals.map((s) => s.signalType)).size;
    const confidenceScore  = parseFloat(Math.min(1.0, (signalTypeCount / 3) + (allSignals.length > 0 ? 0.2 : 0)).toFixed(2));

    // 4. Persist individual signals to ExternalSignal table
    const dateKey = new Date(date);
    dateKey.setHours(0, 0, 0, 0);

    for (const signal of allSignals) {
        try {
            await prisma.externalSignal.create({
                data: {
                    shopId,
                    date:       dateKey,
                    signalType: signal.signalType,
                    signalName: signal.signalName,
                    intensity:  signal.intensity,
                    source:     signal.source,
                    metadata:   signal.metadata || {},
                },
            });
        } catch (err) {
            // Non-fatal: log and continue
            Logger.warn(`[SignalAggregator] Could not persist signal '${signal.signalName}' for shop ${shopId}: ${err.message}`);
        }
    }

    // 5. Build signal factors summary
    const signalFactors = {};
    for (const signal of allSignals) {
        signalFactors[signal.signalType.toLowerCase()] = signal.intensity;
    }

    Logger.info(`[SignalAggregator] Shop ${shopId} on ${dateKey.toISOString().split("T")[0]}: composite=${compositeIntensity}, confidence=${confidenceScore}, signals=${allSignals.length}`);

    return {
        shopId,
        date:               dateKey,
        compositeIntensity,
        signalFactors,
        confidenceScore,
        signals:            allSignals,
        signalCount:        allSignals.length,
    };
};

/**
 * Compute and persist DailySignalAdjustedMetrics for a shop on a given date.
 * Pulls base revenue from DailyShopMetrics and applies composite signal factor.
 *
 * @param {string} shopId
 * @param {Date}   date
 * @param {Object} [shopConfig]
 */
const computeAdjustedMetrics = async (shopId, date, shopConfig = {}) => {
    const dateKey = new Date(date);
    dateKey.setHours(0, 0, 0, 0);

    // Get base revenue from precomputed daily metrics
    const dailyMetrics = await prisma.dailyShopMetrics.findUnique({
        where: { shopId_date: { shopId, date: dateKey } },
        select: { totalRevenue: true },
    });

    const baseRevenue = dailyMetrics?.totalRevenue || 0;

    // Aggregate signals and get composite intensity
    const aggregation = await aggregateSignals(shopId, date, shopConfig);

    const adjustedRevenue = parseFloat((baseRevenue * aggregation.compositeIntensity).toFixed(2));

    // Upsert adjusted metrics
    await prisma.dailySignalAdjustedMetrics.upsert({
        where: { shopId_date: { shopId, date: dateKey } },
        create: {
            shopId,
            date:           dateKey,
            baseRevenue,
            adjustedRevenue,
            signalFactors:  aggregation.signalFactors,
            confidenceScore: aggregation.confidenceScore,
        },
        update: {
            baseRevenue,
            adjustedRevenue,
            signalFactors:  aggregation.signalFactors,
            confidenceScore: aggregation.confidenceScore,
        },
    });

    return {
        shopId,
        date:              dateKey,
        baseRevenue,
        adjustedRevenue,
        compositeIntensity: aggregation.compositeIntensity,
        confidenceScore:   aggregation.confidenceScore,
        signals:           aggregation.signals,
    };
};

module.exports = {
    aggregateSignals,
    computeAdjustedMetrics,
    SIGNAL_WEIGHTS,
};
