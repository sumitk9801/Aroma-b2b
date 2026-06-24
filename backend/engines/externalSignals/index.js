const { prisma } = require("../../db/db");
const festivalCalendarAdapter = require("../../analytics/adapters/festivalCalendarAdapter");
const holidayAdapter          = require("../../analytics/adapters/holidayAdapter");

/**
 * External Signals Engine — Public API Surface (V2.4)
 *
 * Exposes analysis functions built on top of stored ExternalSignal data
 * and adapter utilities for on-demand impact queries.
 *
 * Architecture position:
 *   External Signals → [External Signals Engine] → Forecast Engine (overlay)
 *                                                 → Recommendation Engine
 *                                                 → AI Business Assistant
 */

/**
 * Get stored external signals for a shop in a date range.
 * @param {string} shopId
 * @param {number} [days=30]
 * @param {string} [signalType] - Optional filter: "WEATHER"|"FESTIVAL"|"HOLIDAY"
 */
const getSignalHistory = async (shopId, days = 30, signalType = null) => {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const where = { shopId, date: { gte: since } };
    if (signalType) where.signalType = signalType;

    const signals = await prisma.externalSignal.findMany({
        where,
        orderBy: { date: "desc" },
    });

    return signals.map((s) => ({
        id:         s.id,
        date:       s.date.toISOString().split("T")[0],
        signalType: s.signalType,
        signalName: s.signalName,
        intensity:  s.intensity,
        source:     s.source,
        metadata:   s.metadata,
    }));
};

/**
 * Get the composite signal-adjusted metrics for a shop.
 * @param {string} shopId
 * @param {number} [days=30]
 */
const getAdjustedMetricsHistory = async (shopId, days = 30) => {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const records = await prisma.dailySignalAdjustedMetrics.findMany({
        where:   { shopId, date: { gte: since } },
        orderBy: { date: "desc" },
    });

    return records.map((r) => ({
        date:            r.date.toISOString().split("T")[0],
        baseRevenue:     r.baseRevenue,
        adjustedRevenue: r.adjustedRevenue,
        signalFactors:   r.signalFactors,
        confidenceScore: r.confidenceScore,
        adjustment:      parseFloat(((r.adjustedRevenue - r.baseRevenue) / (r.baseRevenue || 1) * 100).toFixed(1)),
    }));
};

/**
 * Get upcoming high-impact events (festivals + holidays) for the next N days.
 * Used by the AI Assistant to warn about upcoming demand spikes.
 * @param {number} [days=14]
 */
const getUpcomingImpactEvents = (days = 14) => {
    const festivals = festivalCalendarAdapter.getUpcomingFestivals(days);
    const holidays  = holidayAdapter.getUpcomingHolidays(days);

    const combined = [
        ...festivals.map((f) => ({ ...f, category: "FESTIVAL" })),
        ...holidays.map((h) => ({ ...h, category: "HOLIDAY", intensity: h.closureExpected ? 0.80 : 1.00 })),
    ].sort((a, b) => a.daysAhead - b.daysAhead);

    return {
        upcomingDays: days,
        highImpact:   combined.filter((e) => (e.intensity || 1) >= 1.2),
        allEvents:    combined,
        hasMajorEvent: combined.some((e) => (e.intensity || 1) >= 1.3),
    };
};

/**
 * Get current signal context for the AI Assistant.
 * Returns today's and upcoming signals in a concise format.
 * @param {string} shopId
 */
const getSignalContext = async (shopId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySignals = await prisma.externalSignal.findMany({
        where: { shopId, date: { gte: today } },
        orderBy: { intensity: "desc" },
    });

    const todayAdjusted = await prisma.dailySignalAdjustedMetrics.findUnique({
        where: { shopId_date: { shopId, date: today } },
    }).catch(() => null);

    const upcoming = getUpcomingImpactEvents(7);

    return {
        today: {
            signals:           todaySignals.map((s) => ({ type: s.signalType, name: s.signalName, intensity: s.intensity })),
            compositeIntensity: todayAdjusted?.confidenceScore ? todayAdjusted.signalFactors : null,
            adjustedRevenue:   todayAdjusted?.adjustedRevenue || null,
        },
        upcoming: upcoming.allEvents.slice(0, 5),
        hasUpcomingHighImpact: upcoming.hasMajorEvent,
    };
};

module.exports = {
    getSignalHistory,
    getAdjustedMetricsHistory,
    getUpcomingImpactEvents,
    getSignalContext,
};
