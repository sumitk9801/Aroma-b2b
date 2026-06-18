const { classifyIntent, describeIntent } = require("./intentRouter");
const { buildContext }                   = require("./contextBuilder");
const { buildSystemPrompt, buildUserPrompt, buildDailyBriefingPrompts } = require("./promptTemplates");
const { ask, checkConfiguration }        = require("./llmAdapter");
const { getUpcomingImpactEvents }        = require("../engines/externalSignals");
const { getVelocitySummary }             = require("../engines/inventoryIntelligence");
const { getCriticalStockRisks }          = require("../engines/forecastEngine");
const Logger = require("../utils/logger");

/**
 * AI Business Assistant — V2.6 Orchestrator
 *
 * Main entry point for the assistant. Coordinates:
 *   intent classification → context building → prompt construction → LLM call
 *
 * All computation happens BEFORE the LLM call.
 * The LLM only narrates pre-computed results.
 */

/**
 * Ask the AI Business Assistant a question.
 *
 * @param {Object} params
 * @param {string} params.shopId   - The shop context
 * @param {string} params.question - Natural language question
 * @param {boolean} [params.includeContext=false] - Return raw context in response (debug)
 * @returns {Promise<Object>}
 */
const ask_question = async ({ shopId, question, includeContext = false }) => {
    const startTime = Date.now();

    // 1. Validate LLM is configured
    const config = checkConfiguration();
    if (!config.configured) {
        return {
            success:  false,
            error:    `LLM provider "${config.provider}" is not configured. Missing: ${config.missingKey}`,
            fallback: await buildFallbackResponse(shopId, question),
        };
    }

    // 2. Classify intent
    const { intent, confidence, matchedPattern } = classifyIntent(question);
    Logger.info(`[Assistant] Intent: ${intent} (confidence: ${confidence}) — Shop: ${shopId}`);

    // 3. Build analytical context from engines
    const context = await buildContext(intent, shopId);

    // 4. Build prompts
    const systemPrompt = buildSystemPrompt(intent);
    const userPrompt   = buildUserPrompt(context, question);

    // 5. Call LLM
    const answer = await ask(systemPrompt, userPrompt);

    const durationMs = Date.now() - startTime;
    Logger.info(`[Assistant] Response generated in ${durationMs}ms`);

    return {
        success:       true,
        data: {
            answer,
            intent,
            intentDescription: describeIntent(intent),
            confidence,
            sourceEngines:     getSourceEngines(intent),
            context:           includeContext ? context : undefined,
            shopId,
            durationMs,
            generatedAt:       new Date().toISOString(),
        },
    };
};

/**
 * Get proactive insight suggestions for a shop (no question needed).
 * Returns top 3 actionable insights based on current inventory state.
 *
 * @param {string} shopId
 * @returns {Promise<Object>}
 */
const getSuggestions = async (shopId) => {
    const [criticalRisks, velocitySummary, upcomingEvents] = await Promise.all([
        getCriticalStockRisks(shopId),
        getVelocitySummary(shopId),
        getUpcomingImpactEvents(7),
    ]);

    const suggestions = [];

    // Stockout alerts
    if (criticalRisks.length > 0) {
        suggestions.push({
            type:     "STOCKOUT_ALERT",
            priority: "HIGH",
            message:  `${criticalRisks.length} product(s) may run out within their lead time. Immediate reorder recommended.`,
            action:   "Ask: 'Which products may run out this week?'",
            count:    criticalRisks.length,
        });
    }

    // Dead stock alert
    if (velocitySummary.deadStock > 0) {
        suggestions.push({
            type:     "DEAD_STOCK_ALERT",
            priority: "MEDIUM",
            message:  `${velocitySummary.deadStock} product(s) have had no sales in 30 days — capital is tied up.`,
            action:   "Ask: 'What are my dead stock products?'",
            count:    velocitySummary.deadStock,
        });
    }

    // Upcoming high-impact event
    if (upcomingEvents.hasMajorEvent) {
        const nextEvent = upcomingEvents.highImpact[0];
        suggestions.push({
            type:     "EVENT_ALERT",
            priority: "MEDIUM",
            message:  `${nextEvent?.name} is in ${nextEvent?.daysAhead} day(s) — stock up on high-demand products.`,
            action:   "Ask: 'Which products should I stock up before the festival?'",
            event:    nextEvent,
        });
    }

    // Slow mover suggestion
    if (velocitySummary.slowMovers > 3) {
        suggestions.push({
            type:     "SLOW_MOVERS",
            priority: "LOW",
            message:  `${velocitySummary.slowMovers} slow-moving products detected — consider promotional pricing.`,
            action:   "Ask: 'What are my slow-moving products?'",
            count:    velocitySummary.slowMovers,
        });
    }

    return {
        shopId,
        suggestions: suggestions.slice(0, 5),
        generatedAt: new Date().toISOString(),
    };
};

/**
 * Generate a daily business briefing for a shop.
 * Does not require a user question — proactively surfaced each morning.
 *
 * @param {string} shopId
 * @returns {Promise<Object>}
 */
const getDailyBriefing = async (shopId) => {
    const config = checkConfiguration();
    if (!config.configured) {
        const suggestions = await getSuggestions(shopId);
        return {
            success:  true,
            mode:     "SUGGESTIONS_ONLY",
            data: {
                briefing:    null,
                suggestions: suggestions.suggestions,
                note:        `LLM provider not configured (missing ${config.missingKey}) — showing raw suggestions`,
                generatedAt: new Date().toISOString(),
            },
        };
    }

    const context = await buildContext("GENERAL_QUERY", shopId);
    const { systemPrompt, userPrompt } = buildDailyBriefingPrompts(context);
    const briefing = await ask(systemPrompt, userPrompt);

    return {
        success:  true,
        mode:     "AI_BRIEFING",
        data: {
            briefing,
            shopId,
            generatedAt: new Date().toISOString(),
        },
    };
};

/**
 * Fallback response when LLM is not configured.
 * Returns raw analytical context as structured data instead of natural language.
 */
const buildFallbackResponse = async (shopId, question) => {
    const { intent } = classifyIntent(question);
    const context    = await buildContext(intent, shopId);
    return {
        intent,
        note:    "LLM provider not configured — raw analytics data returned instead",
        context,
    };
};

/**
 * Map intent to the engine(s) it uses — for audit/transparency.
 */
const getSourceEngines = (intent) => {
    const map = {
        REORDER_QUERY:     ["forecastEngine", "recommendationEngine"],
        STOCKOUT_RISK:     ["forecastEngine"],
        SLOW_MOVERS:       ["inventoryIntelligence"],
        DEAD_STOCK:        ["inventoryIntelligence"],
        CAPITAL_RISK:      ["inventoryIntelligence"],
        FORECAST_QUERY:    ["forecastEngine", "externalSignals"],
        DECLINE_QUERY:     ["inventoryIntelligence", "externalSignals"],
        GROWTH_QUERY:      ["recommendationEngine", "externalSignals"],
        PERFORMANCE_QUERY: ["inventoryIntelligence", "forecastEngine"],
        TURNOVER_QUERY:    ["inventoryIntelligence"],
        GENERAL_QUERY:     ["inventoryIntelligence"],
    };
    return map[intent] || ["inventoryIntelligence"];
};

module.exports = {
    ask_question,
    getSuggestions,
    getDailyBriefing,
};
