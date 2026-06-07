const { prisma } = require("../db/db");

const VALID_REASONS = ["expired", "broken", "water_damage", "fire_damage", "theft", "handling_error", "quality_issue", "other"];

/**
 * Report a damage/write-off event. Deducts stock and logs in DamagedStock table + StockMovement.
 */
const reportDamage = async (data, userId) => {
    const { shopId, productId, quantity, reason } = data;

    if (quantity <= 0) throw new Error("Quantity must be positive");

    return await prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) throw new Error("Product not found");
        if (product.currentStock < quantity) {
            throw new Error(`Cannot report damage of ${quantity} units. Current stock is only ${product.currentStock}`);
        }

        const newStock = product.currentStock - quantity;
        const valueLost = parseFloat((quantity * product.purchasePrice).toFixed(2));

        // 1. Update product stock
        await tx.product.update({
            where: { id: productId },
            data: { currentStock: newStock }
        });

        // 2. Log in DamagedStock table (dedicated damage log)
        const damageRecord = await tx.damagedStock.create({
            data: {
                shopId: shopId || product.shopId,
                productId,
                quantity: parseFloat(quantity),
                reason: reason || "other",
                valueLost,
                reportedBy: userId
            },
            include: {
                product: { select: { id: true, name: true, skuCode: true } },
                reporter: { select: { id: true, name: true } }
            }
        });

        // 3. Log in StockMovement table for full audit trail
        await tx.stockMovement.create({
            data: {
                shopId: shopId || product.shopId,
                productId,
                type: "damage",
                quantity: parseFloat(quantity),
                previousStock: product.currentStock,
                newStock,
                referenceType: "damage_report",
                referenceId: damageRecord.id,
                note: `Damage write-off: ${reason || "other"}. Value lost: ₹${valueLost}`,
                createdBy: userId
            }
        });

        return damageRecord;
    });
};

/**
 * Get all damage reports for a shop with optional date range filtering.
 */
const getAllDamageReports = async (shopId, startDate, endDate) => {
    const where = { shopId };
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            where.createdAt.lte = end;
        }
    }

    return await prisma.damagedStock.findMany({
        where,
        include: {
            product: { select: { id: true, name: true, skuCode: true, purchasePrice: true } },
            reporter: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: "desc" }
    });
};

/**
 * Get a damage summary — total value lost, most damaged products, damage by reason.
 */
const getDamageSummary = async (shopId, startDate, endDate) => {
    const where = { shopId };
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            where.createdAt.lte = end;
        }
    }

    const [aggregate, allReports] = await Promise.all([
        prisma.damagedStock.aggregate({
            where,
            _count: { id: true },
            _sum: { valueLost: true, quantity: true }
        }),
        prisma.damagedStock.findMany({
            where,
            include: {
                product: { select: { id: true, name: true, skuCode: true } }
            }
        })
    ]);

    // Group by product to find most damaged
    const productMap = {};
    const reasonMap = {};
    for (const r of allReports) {
        const pid = r.productId;
        if (!productMap[pid]) {
            productMap[pid] = { productId: pid, name: r.product.name, skuCode: r.product.skuCode, totalQty: 0, totalValue: 0, events: 0 };
        }
        productMap[pid].totalQty += r.quantity;
        productMap[pid].totalValue += r.valueLost;
        productMap[pid].events += 1;

        const reason = r.reason || "other";
        reasonMap[reason] = (reasonMap[reason] || 0) + 1;
    }

    const mostDamagedProducts = Object.values(productMap)
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 10)
        .map(p => ({ ...p, totalValue: parseFloat(p.totalValue.toFixed(2)) }));

    const damageByReason = Object.entries(reasonMap).map(([reason, count]) => ({ reason, count }));

    return {
        totalEvents: aggregate._count.id || 0,
        totalQuantityLost: aggregate._sum.quantity || 0,
        totalValueLost: parseFloat((aggregate._sum.valueLost || 0).toFixed(2)),
        mostDamagedProducts,
        damageByReason
    };
};

/**
 * Get damage history for a specific product.
 */
const getDamageByProduct = async (productId) => {
    return await prisma.damagedStock.findMany({
        where: { productId },
        include: {
            reporter: { select: { id: true, name: true } },
            shop: { select: { id: true, shopName: true } }
        },
        orderBy: { createdAt: "desc" }
    });
};

module.exports = { reportDamage, getAllDamageReports, getDamageSummary, getDamageByProduct };
