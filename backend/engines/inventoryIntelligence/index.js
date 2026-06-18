/**
 * Inventory Intelligence Engine — Public API Surface
 *
 * Single import point for all inventory intelligence capabilities.
 * Consumed by the Recommendation Engine and AI Business Assistant.
 *
 * Architecture position:
 *   Forecast Engine → [Inventory Intelligence Engine] → Recommendation Engine
 *                                                      → AI Business Assistant
 */

const velocityClassifier = require("./velocityClassifier");
const turnoverAnalyzer   = require("./turnoverAnalyzer");
const capitalRiskAnalyzer = require("./capitalRiskAnalyzer");

module.exports = {
    // ── Velocity Classification (ABC Analysis) ────────────────────────
    /** Full ABC classification of all active products in a shop. */
    classifyProductVelocity: velocityClassifier.classifyProductVelocity,

    /** Slow movers (C-class) and dead stock (D-class) products. */
    getSlowAndDeadMovers: velocityClassifier.getSlowAndDeadMovers,

    /** Fast mover (A-class) products. */
    getFastMovers: velocityClassifier.getFastMovers,

    /** Summary counts per velocity class + full classification. */
    getVelocitySummary: velocityClassifier.getVelocitySummary,

    // ── Turnover Analysis ─────────────────────────────────────────────
    /** Shop-level ITR, DIO, and benchmark label. */
    calculateTurnoverRatio: turnoverAnalyzer.calculateTurnoverRatio,

    /** Per-product turnover contribution breakdown. */
    getProductTurnoverBreakdown: turnoverAnalyzer.getProductTurnoverBreakdown,

    // ── Capital Risk Analysis ─────────────────────────────────────────
    /** Full capital risk analysis: dead stock, holding costs, liquidation values. */
    analyzeCapitalRisk: capitalRiskAnalyzer.analyzeCapitalRisk,

    /** Concise dead stock risk summary (used by AI Assistant). */
    getDeadStockRisk: capitalRiskAnalyzer.getDeadStockRisk,

    // ── Low Stock Intelligence (convenience) ──────────────────────────
    /** Get all products at or below minimum stock threshold. */
    getLowStockProducts: async (shopId) => {
        const { prisma } = require("../../db/db");
        const products = await prisma.product.findMany({
            where: { shopId, isActive: true },
            select: {
                id: true, name: true, skuCode: true,
                currentStock: true, minimumStock: true,
                categoryRef: { select: { name: true } },
            },
        });
        return products
            .filter((p) => p.currentStock <= p.minimumStock)
            .map((p) => ({
                productId:    p.id,
                productName:  p.name,
                skuCode:      p.skuCode,
                currentStock: p.currentStock,
                minimumStock: p.minimumStock,
                categoryName: p.categoryRef?.name || null,
                deficit:      parseFloat((p.minimumStock - p.currentStock).toFixed(2)),
            }));
    },

    // ── Constants ─────────────────────────────────────────────────────
    VELOCITY_CLASSES: velocityClassifier.VELOCITY_CLASSES,
    VELOCITY_LABELS:  velocityClassifier.VELOCITY_LABELS,
};
