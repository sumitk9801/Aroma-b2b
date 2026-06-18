/**
 * Intent Router — V2.6 AI Business Assistant
 *
 * Classifies the user's natural language question into one of the
 * predefined intent categories. The intent determines which engine(s)
 * the context builder will query.
 *
 * Design principle: Pattern matching is intentionally broad and
 * order-independent. The first matching pattern wins.
 */

const INTENTS = {
    REORDER_QUERY:      "REORDER_QUERY",
    STOCKOUT_RISK:      "STOCKOUT_RISK",
    SLOW_MOVERS:        "SLOW_MOVERS",
    FORECAST_QUERY:     "FORECAST_QUERY",
    PERFORMANCE_QUERY:  "PERFORMANCE_QUERY",
    DECLINE_QUERY:      "DECLINE_QUERY",
    GROWTH_QUERY:       "GROWTH_QUERY",
    DEAD_STOCK:         "DEAD_STOCK",
    CAPITAL_RISK:       "CAPITAL_RISK",
    TURNOVER_QUERY:     "TURNOVER_QUERY",
    GENERAL_QUERY:      "GENERAL_QUERY",
};

// Pattern definitions — order matters (more specific first)
const INTENT_PATTERNS = [
    // Stockout / running out
    { intent: INTENTS.STOCKOUT_RISK,     patterns: [/run out/i, /stockout/i, /out of stock/i, /finish.*this week/i, /empty.*soon/i, /which.*run/i] },

    // Reorder / purchase planning
    { intent: INTENTS.REORDER_QUERY,     patterns: [/reorder/i, /restock/i, /buy more/i, /order more/i, /purchase/i, /what.*should.*order/i] },

    // Slow movers
    { intent: INTENTS.SLOW_MOVERS,       patterns: [/slow.mov/i, /not selling/i, /moving slow/i, /low demand/i, /least sold/i] },

    // Dead stock
    { intent: INTENTS.DEAD_STOCK,        patterns: [/dead stock/i, /idle inventory/i, /no sales/i, /never sold/i, /zero.*sales/i] },

    // Capital / financial risk
    { intent: INTENTS.CAPITAL_RISK,      patterns: [/capital.*tied/i, /money.*stuck/i, /financial.*risk/i, /tied up/i, /cash.*locked/i] },

    // Inventory turnover
    { intent: INTENTS.TURNOVER_QUERY,    patterns: [/turnover/i, /turn.*rate/i, /how fast.*selling/i, /inventory ratio/i, /dio\b/i] },

    // Forecast / prediction
    { intent: INTENTS.FORECAST_QUERY,    patterns: [/forecast/i, /predict/i, /next month/i, /next week/i, /expect.*sell/i, /project/i, /how much.*sell/i] },

    // Decline / decrease explanation
    { intent: INTENTS.DECLINE_QUERY,     patterns: [/declin/i, /decreas/i, /falling/i, /going down/i, /why.*less/i, /why.*drop/i, /why.*low/i, /sales.*down/i] },

    // Growth / trending
    { intent: INTENTS.GROWTH_QUERY,      patterns: [/growing/i, /trending/i, /rising/i, /increase/i, /opportunit/i, /which.*grow/i, /best.*perform/i] },

    // General performance
    { intent: INTENTS.PERFORMANCE_QUERY, patterns: [/performance/i, /revenue/i, /profit/i, /how.*doing/i, /sales.*today/i, /overview/i, /summary/i] },
];

/**
 * Classify a user question into an intent.
 * @param {string} question
 * @returns {{ intent: string, confidence: "HIGH"|"MEDIUM"|"LOW", matchedPattern: string|null }}
 */
const classifyIntent = (question) => {
    if (!question || typeof question !== "string") {
        return { intent: INTENTS.GENERAL_QUERY, confidence: "LOW", matchedPattern: null };
    }

    const q = question.trim();

    for (const entry of INTENT_PATTERNS) {
        for (const pattern of entry.patterns) {
            if (pattern.test(q)) {
                return {
                    intent:         entry.intent,
                    confidence:     "HIGH",
                    matchedPattern: pattern.toString(),
                };
            }
        }
    }

    return {
        intent:         INTENTS.GENERAL_QUERY,
        confidence:     "LOW",
        matchedPattern: null,
    };
};

/**
 * Get a human-readable description of an intent.
 * @param {string} intent
 */
const describeIntent = (intent) => {
    const descriptions = {
        [INTENTS.REORDER_QUERY]:     "Reorder planning — what to buy and how much",
        [INTENTS.STOCKOUT_RISK]:     "Stockout risk — products at risk of running out",
        [INTENTS.SLOW_MOVERS]:       "Slow-moving products — low velocity items",
        [INTENTS.DEAD_STOCK]:        "Dead stock — items with no recent sales",
        [INTENTS.CAPITAL_RISK]:      "Capital risk — money tied up in inventory",
        [INTENTS.TURNOVER_QUERY]:    "Inventory turnover analysis",
        [INTENTS.FORECAST_QUERY]:    "Demand forecast — projected future sales",
        [INTENTS.DECLINE_QUERY]:     "Performance decline analysis",
        [INTENTS.GROWTH_QUERY]:      "Growth opportunities — trending products",
        [INTENTS.PERFORMANCE_QUERY]: "Sales performance overview",
        [INTENTS.GENERAL_QUERY]:     "General inventory question",
    };
    return descriptions[intent] || "Unknown intent";
};

module.exports = {
    classifyIntent,
    describeIntent,
    INTENTS,
};
