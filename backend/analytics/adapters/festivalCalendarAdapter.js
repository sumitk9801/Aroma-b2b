/**
 * Festival Calendar Adapter — V2.4 External Signals Engine
 *
 * Provides a curated, hard-coded Indian festival calendar with demand
 * impact multipliers by festival type and category sensitivity.
 *
 * This adapter does NOT require an external API — the festival calendar
 * is maintained as structured data that can be updated annually or
 * replaced with a live API (e.g., Google Calendar) in V3+.
 *
 * Sources for future API integration:
 *   - Calendarific API (https://calendarific.com/api-documentation)
 *   - Google Calendar API (public holiday calendars)
 *
 * Impact model:
 *   intensity > 1.3 → Major festival (Diwali, Eid, Christmas) — significant demand spike
 *   intensity 1.1–1.3 → Medium festival — moderate increase
 *   intensity 1.0 → Neutral
 *   intensity < 1.0 → Business closure day — demand reduction
 */

const Logger = require("../../utils/logger");

// ─── 2026 Indian Festival Calendar (IST) ─────────────────────────────────────
// Dates in YYYY-MM-DD format. Update annually or integrate with live API.
const FESTIVAL_CALENDAR_2026 = [
    // Q1 Festivals
    { date: "2026-01-14", name: "Makar Sankranti",   intensity: 1.15, type: "FESTIVAL",  season: "winter"  },
    { date: "2026-01-26", name: "Republic Day",       intensity: 0.85, type: "HOLIDAY",   season: "winter"  },
    { date: "2026-02-14", name: "Valentine's Day",    intensity: 1.10, type: "FESTIVAL",  season: "spring"  },
    { date: "2026-02-26", name: "Maha Shivratri",     intensity: 1.12, type: "FESTIVAL",  season: "spring"  },
    { date: "2026-03-13", name: "Holi",               intensity: 1.35, type: "FESTIVAL",  season: "spring"  },

    // Q2 Festivals
    { date: "2026-03-31", name: "Eid ul-Fitr",        intensity: 1.40, type: "FESTIVAL",  season: "spring"  },
    { date: "2026-04-02", name: "Ramnavami",           intensity: 1.15, type: "FESTIVAL",  season: "spring"  },
    { date: "2026-04-05", name: "Easter",              intensity: 1.10, type: "FESTIVAL",  season: "spring"  },
    { date: "2026-04-14", name: "Ambedkar Jayanti",   intensity: 0.90, type: "HOLIDAY",   season: "spring"  },
    { date: "2026-05-01", name: "Labour Day",          intensity: 0.85, type: "HOLIDAY",   season: "summer"  },

    // Q3 Festivals (Monsoon/Post-Monsoon)
    { date: "2026-08-15", name: "Independence Day",   intensity: 1.05, type: "HOLIDAY",   season: "monsoon" },
    { date: "2026-08-25", name: "Janmashtami",        intensity: 1.20, type: "FESTIVAL",  season: "monsoon" },
    { date: "2026-09-03", name: "Ganesh Chaturthi",   intensity: 1.30, type: "FESTIVAL",  season: "autumn"  },

    // Q4 Festivals (Peak Season)
    { date: "2026-10-02", name: "Gandhi Jayanti",     intensity: 0.88, type: "HOLIDAY",   season: "autumn"  },
    { date: "2026-10-12", name: "Navratri Begin",     intensity: 1.20, type: "FESTIVAL",  season: "autumn"  },
    { date: "2026-10-21", name: "Dussehra",           intensity: 1.30, type: "FESTIVAL",  season: "autumn"  },
    { date: "2026-11-01", name: "Diwali",             intensity: 1.55, type: "FESTIVAL",  season: "autumn"  },
    { date: "2026-11-02", name: "Diwali (Day 2)",     intensity: 1.40, type: "FESTIVAL",  season: "autumn"  },
    { date: "2026-11-03", name: "Bhai Dooj",          intensity: 1.25, type: "FESTIVAL",  season: "autumn"  },
    { date: "2026-12-25", name: "Christmas",          intensity: 1.30, type: "FESTIVAL",  season: "winter"  },
    { date: "2026-12-31", name: "New Year's Eve",     intensity: 1.20, type: "FESTIVAL",  season: "winter"  },
];

/**
 * Fetch festival signals for a given date (and surrounding window).
 *
 * @param {Object} params
 * @param {string} params.shopId
 * @param {Date}   params.date
 * @param {number} [params.windowDays=7] - Look-ahead window for upcoming festivals
 * @returns {ExternalSignalPayload[]}
 */
const fetchSignals = ({ shopId, date, windowDays = 7 }) => {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const windowEnd = new Date(targetDate);
    windowEnd.setDate(windowEnd.getDate() + windowDays);

    const signals = [];

    for (const festival of FESTIVAL_CALENDAR_2026) {
        const festDate = new Date(festival.date);
        festDate.setHours(0, 0, 0, 0);

        // Include festivals on the target date or within the upcoming window
        if (festDate >= targetDate && festDate <= windowEnd) {
            const daysAhead = Math.floor((festDate - targetDate) / (1000 * 60 * 60 * 24));

            // Fade intensity slightly for further-ahead signals (pre-festival build-up)
            const fadedIntensity = daysAhead === 0
                ? festival.intensity
                : parseFloat((1 + (festival.intensity - 1) * (1 - daysAhead / windowDays)).toFixed(3));

            signals.push({
                signalType: festival.type,
                signalName: festival.name,
                intensity:  fadedIntensity,
                source:     "FESTIVAL_CALENDAR",
                metadata: {
                    festivalDate:  festival.date,
                    season:        festival.season,
                    daysAhead,
                    peakIntensity: festival.intensity,
                    note: daysAhead === 0
                        ? `${festival.name} is today — peak demand signal`
                        : `${festival.name} in ${daysAhead} days — pre-festival demand building`,
                },
            });
        }
    }

    if (signals.length > 0) {
        Logger.info(`[FestivalAdapter] Found ${signals.length} festival signal(s) for shop ${shopId}`);
    }

    return signals;
};

/**
 * Get all upcoming festivals in the next N days.
 * @param {number} [days=30]
 * @returns {Array}
 */
const getUpcomingFestivals = (days = 30) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setDate(end.getDate() + days);

    return FESTIVAL_CALENDAR_2026
        .filter((f) => {
            const d = new Date(f.date);
            return d >= now && d <= end;
        })
        .map((f) => ({
            ...f,
            daysAhead: Math.floor((new Date(f.date) - now) / (1000 * 60 * 60 * 24)),
        }))
        .sort((a, b) => a.daysAhead - b.daysAhead);
};

module.exports = {
    fetchSignals,
    getUpcomingFestivals,
    FESTIVAL_CALENDAR_2026,
};
