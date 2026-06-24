const inventoryIntelligence = require("../inventoryIntelligence");

/**
 * Promotion Recommender — Recommendation Engine
 *
 * Identifies products that would benefit from promotional interventions
 * to improve velocity, reduce dead stock, and release tied-up capital.
 *
 * Promotion types:
 *   MARKDOWN       — Reduce price to liquidate dead/slow stock
 *   BUNDLE         — Pair with fast-movers to increase attachment
 *   HIGHLIGHT      — Feature in promotions to boost visibility
 *   CLEARANCE      — Deep discount on very old dead stock
 */

const PROMO_TYPES = {
    MARKDOWN:  "MARKDOWN",
    BUNDLE:    "BUNDLE",
    HIGHLIGHT: "HIGHLIGHT",
    CLEARANCE: "CLEARANCE",
};

/**
 * Generate promotion recommendations for a shop.
 *
 * @param {string} shopId
 * @returns {Promise<Object>}
 */
const getPromotionRecommendations = async (shopId) => {
    const { deadStockProducts, slowStockProducts, summary } =
        await inventoryIntelligence.analyzeCapitalRisk(shopId);

    const recommendations = [];

    // Dead stock → CLEARANCE if old, MARKDOWN if recent
    for (const product of deadStockProducts) {
        const type = product.daysInCatalog > 90 ? PROMO_TYPES.CLEARANCE : PROMO_TYPES.MARKDOWN;
        const discountPct = product.daysInCatalog > 90 ? 40 : 20;

        recommendations.push({
            productId:       product.productId,
            productName:     product.productName,
            skuCode:         product.skuCode,
            currentStock:    product.currentStock,
            promoType:       type,
            priority:        type === PROMO_TYPES.CLEARANCE ? "HIGH" : "MEDIUM",
            suggestion:      `Apply ${discountPct}% discount — no sales in 30+ days`,
            capitalTiedUp:   product.capitalTiedUp,
            suggestedDiscount: discountPct,
            estimatedRecovery: parseFloat((product.capitalTiedUp * (1 - discountPct / 100)).toFixed(2)),
            reason:          `Dead stock — ${product.daysInCatalog} days in catalog, ₹${product.capitalTiedUp} capital tied up`,
        });
    }

    // Slow movers → BUNDLE or HIGHLIGHT
    for (const product of slowStockProducts.slice(0, 10)) {
        const type = product.unitsSoldLast30d > 0 ? PROMO_TYPES.BUNDLE : PROMO_TYPES.HIGHLIGHT;

        recommendations.push({
            productId:       product.productId,
            productName:     product.productName,
            skuCode:         product.skuCode,
            currentStock:    product.currentStock,
            promoType:       type,
            priority:        "LOW",
            suggestion:      type === PROMO_TYPES.BUNDLE
                ? "Bundle with a fast-moving product to increase attachment rate"
                : "Feature in weekly promotions or place near checkout",
            capitalTiedUp:   product.capitalTiedUp,
            suggestedDiscount: 10,
            estimatedRecovery: null,
            reason:          `Slow mover — only ${product.unitsSoldLast30d} units sold in 30 days`,
        });
    }

    return {
        shopId,
        generatedAt:          new Date().toISOString(),
        totalRecommendations: recommendations.length,
        summary: {
            clearanceItems:   recommendations.filter((r) => r.promoType === PROMO_TYPES.CLEARANCE).length,
            markdownItems:    recommendations.filter((r) => r.promoType === PROMO_TYPES.MARKDOWN).length,
            bundleItems:      recommendations.filter((r) => r.promoType === PROMO_TYPES.BUNDLE).length,
            totalCapitalAtRisk: summary.totalCapitalAtRisk,
        },
        recommendations: recommendations.sort((a, b) => b.capitalTiedUp - a.capitalTiedUp),
    };
};

module.exports = {
    getPromotionRecommendations,
    PROMO_TYPES,
};
