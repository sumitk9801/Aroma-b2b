const { prisma } = require("../db/db");

/**
 * Calculates a quick high-level summary of store activities for today.
 * @param {string} [shopId] - Optional shop ID context filter.
 */
const getSummary = async (shopId) => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const whereClause = shopId ? { shopId } : {};

    // Parallel execution of summary counts to prevent sequential blocking
    const [
        totalProducts,
        totalCategories,
        salesTodayAggregate,
        lowStockProducts,
        purchasesTodayCount
    ] = await Promise.all([
        prisma.product.count({
            where: {
                ...whereClause,
                isActive: true
            }
        }),
        prisma.category.count({
            where: whereClause
        }),
        prisma.sale.aggregate({
            where: {
                ...whereClause,
                createdAt: {
                    gte: startOfToday,
                    lte: endOfToday
                }
            },
            _count: {
                id: true
            },
            _sum: {
                totalAmount: true
            }
        }),
        prisma.product.findMany({
            where: whereClause,
            select: {
                id: true,
                currentStock: true,
                minimumStock: true
            }
        }),
        prisma.purchase.count({
            where: {
                ...whereClause,
                createdAt: {
                    gte: startOfToday,
                    lte: endOfToday
                }
            }
        })
    ]);

    // Calculate low stock programmatically to maintain database query simplification
    const lowStockCount = lowStockProducts.filter(p => p.currentStock <= p.minimumStock).length;

    return {
        totalProducts,
        totalCategories,
        totalSalesToday: salesTodayAggregate._count.id || 0,
        totalRevenueToday: salesTodayAggregate._sum.totalAmount || 0.00,
        lowStockCount,
        totalPurchasesToday: purchasesTodayCount
    };
};

/**
 * Retrieves the latest checkout transactions.
 * @param {string} [shopId] - Optional shop ID context filter.
 * @param {number} [limit=10] - Number of records to return.
 */
const getRecentSales = async (shopId, limit = 10) => {
    const whereClause = shopId ? { shopId } : {};

    return await prisma.sale.findMany({
        where: whereClause,
        take: limit,
        orderBy: {
            createdAt: "desc"
        },
        include: {
            creator: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true
                }
            },
            items: {
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            skuCode: true
                        }
                    }
                }
            }
        }
    });
};

/**
 * Compiles the highest volume and revenue-generating products using an optimized aggregation query.
 * @param {string} [shopId] - Optional shop ID context filter.
 * @param {number} [limit=5] - Number of top products to retrieve.
 */
const getTopProducts = async (shopId, limit = 5) => {
    const whereClause = shopId ? { sale: { shopId } } : {};

    // Group sales items by product ID
    const aggregations = await prisma.saleItem.groupBy({
        by: ["productId"],
        where: whereClause,
        _sum: {
            quantity: true,
            subtotal: true
        },
        orderBy: {
            _sum: {
                quantity: "desc"
            }
        },
        take: limit
    });

    if (aggregations.length === 0) return [];

    // Hydrate product details in a single batch query
    const productIds = aggregations.map(a => a.productId);
    const products = await prisma.product.findMany({
        where: {
            id: { in: productIds }
        },
        select: {
            id: true,
            name: true,
            skuCode: true,
            sellingPrice: true
        }
    });

    // Map properties together
    const productMap = new Map(products.map(p => [p.id, p]));

    return aggregations.map(agg => {
        const product = productMap.get(agg.productId);
        return {
            productId: agg.productId,
            name: product ? product.name : "Unknown Product",
            skuCode: product ? product.skuCode : "N/A",
            quantitySold: agg._sum.quantity || 0,
            revenueGenerated: agg._sum.subtotal || 0.00
        };
    });
};

/**
 * Finds all active products that have dropped beneath minimum restock thresholds.
 * @param {string} [shopId] - Optional shop ID context filter.
 */
const getLowStock = async (shopId) => {
    const whereClause = shopId ? { shopId } : {};

    const products = await prisma.product.findMany({
        where: {
            ...whereClause,
            isActive: true
        },
        select: {
            id: true,
            name: true,
            skuCode: true,
            currentStock: true,
            minimumStock: true,
            categoryRef: {
                select: {
                    name: true
                }
            }
        }
    });

    // Filter programmatically to leverage standard DB columns efficiently
    return products
        .filter(p => p.currentStock <= p.minimumStock)
        .map(p => ({
            id: p.id,
            name: p.name,
            skuCode: p.skuCode,
            currentStock: p.currentStock,
            minimumStock: p.minimumStock,
            categoryName: p.categoryRef ? p.categoryRef.name : null
        }));
};

/**
 * Returns multi-period sales metrics (7-day and 30-day aggregations) to construct line/bar charts.
 * @param {string} [shopId] - Optional shop ID context filter.
 */
const getSalesChart = async (shopId) => {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - 30);
    dateLimit.setHours(0, 0, 0, 0);

    const whereClause = {
        createdAt: { gte: dateLimit }
    };
    if (shopId) {
        whereClause.shopId = shopId;
    }

    const sales = await prisma.sale.findMany({
        where: whereClause,
        select: {
            createdAt: true,
            totalAmount: true
        },
        orderBy: {
            createdAt: "asc"
        }
    });

    // Sub-function to compile timeline aggregations for a specified number of days
    const aggregateForDays = (daysCount) => {
        const boundaryDate = new Date();
        boundaryDate.setDate(boundaryDate.getDate() - daysCount);
        boundaryDate.setHours(0, 0, 0, 0);

        const filterSales = sales.filter(s => s.createdAt >= boundaryDate);

        // Group amounts by local YYYY-MM-DD date string
        const dailyMap = {};
        for (let i = daysCount - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split("T")[0];
            dailyMap[dateStr] = 0.00;
        }

        for (const sale of filterSales) {
            const dateStr = sale.createdAt.toISOString().split("T")[0];
            if (dailyMap[dateStr] !== undefined) {
                dailyMap[dateStr] += sale.totalAmount;
            } else {
                dailyMap[dateStr] = sale.totalAmount;
            }
        }

        return Object.entries(dailyMap).map(([date, revenue]) => ({
            date,
            revenue: parseFloat(revenue.toFixed(2))
        }));
    };

    return {
        last7Days: aggregateForDays(7),
        last30Days: aggregateForDays(30)
    };
};

module.exports = {
    getSummary,
    getRecentSales,
    getTopProducts,
    getLowStock,
    getSalesChart
};
