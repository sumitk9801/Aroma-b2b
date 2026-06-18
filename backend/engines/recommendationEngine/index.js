/**
 * Recommendation Engine — Public API Surface
 *
 * Single import point for all recommendation capabilities.
 * Consumed exclusively by the AI Business Assistant's context builder.
 *
 * Architecture position:
 *   Inventory Intelligence Engine → [Recommendation Engine] → AI Business Assistant
 */

const reorderRecommender   = require("./reorderRecommender");
const promotionRecommender = require("./promotionRecommender");
const opportunityScorer    = require("./opportunityScorer");

module.exports = {
    // ── Reorder Recommendations ───────────────────────────────────────
    /**
     * Prioritized "what to buy and how much" recommendations.
     * Returns CRITICAL, URGENT, PLANNED, MONITOR tiers.
     */
    getReorderRecommendations: reorderRecommender.getReorderRecommendations,

    // ── Promotion Recommendations ─────────────────────────────────────
    /**
     * Markdown, bundle, and clearance recommendations for slow/dead stock.
     */
    getPromotionRecommendations: promotionRecommender.getPromotionRecommendations,

    // ── Opportunity Scoring ───────────────────────────────────────────
    /**
     * Growth opportunity scores (0–100) per product using trend + forecast data.
     */
    getOpportunityScores: opportunityScorer.getOpportunityScores,

    // ── Constants ─────────────────────────────────────────────────────
    PRIORITY_TIERS: reorderRecommender.PRIORITY_TIERS,
    PROMO_TYPES:    promotionRecommender.PROMO_TYPES,
};
