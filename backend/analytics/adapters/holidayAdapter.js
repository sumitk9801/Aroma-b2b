/**
 * Holiday Adapter — V2.4 External Signals Engine
 *
 * Provides Indian national holiday data with business impact signals.
 * Holidays typically cause demand reduction (business closures) or
 * pre-holiday demand spikes (the day before a closure).
 *
 * Impact model:
 *   Day before holiday: intensity 1.10–1.20 (last-minute purchasing)
 *   Holiday itself:     intensity 0.70–0.90 (reduced business activity)
 *   Day after holiday:  intensity 1.05–1.10 (catch-up purchases)
 */

const Logger = require("../../utils/logger");

// 2026 Indian National & Regional Holidays
const HOLIDAY_CALENDAR_2026 = [
    { date: "2026-01-01", name: "New Year's Day",         type: "NATIONAL",  closureExpected: false },
    { date: "2026-01-26", name: "Republic Day",           type: "NATIONAL",  closureExpected: true  },
    { date: "2026-03-31", name: "Eid ul-Fitr",            type: "NATIONAL",  closureExpected: true  },
    { date: "2026-04-14", name: "Ambedkar Jayanti",       type: "NATIONAL",  closureExpected: true  },
    { date: "2026-04-14", name: "Good Friday",            type: "NATIONAL",  closureExpected: true  },
    { date: "2026-05-01", name: "Labour Day",             type: "NATIONAL",  closureExpected: true  },
    { date: "2026-08-15", name: "Independence Day",       type: "NATIONAL",  closureExpected: true  },
    { date: "2026-10-02", name: "Gandhi Jayanti",         type: "NATIONAL",  closureExpected: true  },
    { date: "2026-10-21", name: "Dussehra",               type: "NATIONAL",  closureExpected: false },
    { date: "2026-11-01", name: "Diwali",                 type: "NATIONAL",  closureExpected: false },
    { date: "2026-12-25", name: "Christmas",              type: "NATIONAL",  closureExpected: false },
];

/**
 * Generate holiday-related signals for a given date.
 * Produces signals for:
 *   - Pre-holiday (day before): surge signal
 *   - Holiday day: reduction signal
 *   - Post-holiday (day after): recovery signal
 *
 * @param {Object} params
 * @param {string} params.shopId
 * @param {Date}   params.date
 * @returns {ExternalSignalPayload[]}
 */
const fetchSignals = ({ shopId, date }) => {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const targetStr = targetDate.toISOString().split("T")[0];

    const signals = [];

    for (const holiday of HOLIDAY_CALENDAR_2026) {
        const holidayDate = new Date(holiday.date);
        holidayDate.setHours(0, 0, 0, 0);

        const preHoliday  = new Date(holidayDate);
        preHoliday.setDate(preHoliday.getDate() - 1);
        const postHoliday = new Date(holidayDate);
        postHoliday.setDate(postHoliday.getDate() + 1);

        const preStr  = preHoliday.toISOString().split("T")[0];
        const postStr = postHoliday.toISOString().split("T")[0];

        if (targetStr === holiday.date) {
            // Holiday day itself
            signals.push({
                signalType: "HOLIDAY",
                signalName: `${holiday.name} (Holiday)`,
                intensity:  holiday.closureExpected ? 0.75 : 0.90,
                source:     "HOLIDAY_CALENDAR",
                metadata: {
                    holidayType:     holiday.type,
                    closureExpected: holiday.closureExpected,
                    note: holiday.closureExpected
                        ? `${holiday.name}: Business closures expected — reduced demand`
                        : `${holiday.name}: Partial closures — slightly reduced demand`,
                },
            });
        } else if (targetStr === preStr) {
            // Day before holiday — last-minute buying
            signals.push({
                signalType: "HOLIDAY",
                signalName: `Pre-${holiday.name} Rush`,
                intensity:  holiday.closureExpected ? 1.18 : 1.08,
                source:     "HOLIDAY_CALENDAR",
                metadata: {
                    holidayDate:     holiday.date,
                    holidayType:     holiday.type,
                    note: `Day before ${holiday.name} — last-minute purchasing expected`,
                },
            });
        } else if (targetStr === postStr) {
            // Day after holiday — catch-up demand
            signals.push({
                signalType: "HOLIDAY",
                signalName: `Post-${holiday.name} Recovery`,
                intensity:  1.07,
                source:     "HOLIDAY_CALENDAR",
                metadata: {
                    holidayDate:     holiday.date,
                    holidayType:     holiday.type,
                    note: `Day after ${holiday.name} — catch-up demand recovery`,
                },
            });
        }
    }

    if (signals.length > 0) {
        Logger.info(`[HolidayAdapter] Found ${signals.length} holiday signal(s) for date ${targetStr}`);
    }

    return signals;
};

/**
 * Get all upcoming holidays in the next N days.
 * @param {number} [days=14]
 */
const getUpcomingHolidays = (days = 14) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setDate(end.getDate() + days);

    return HOLIDAY_CALENDAR_2026
        .filter((h) => {
            const d = new Date(h.date);
            return d >= now && d <= end;
        })
        .map((h) => ({
            ...h,
            daysAhead: Math.floor((new Date(h.date) - now) / (1000 * 60 * 60 * 24)),
        }));
};

module.exports = {
    fetchSignals,
    getUpcomingHolidays,
    HOLIDAY_CALENDAR_2026,
};
