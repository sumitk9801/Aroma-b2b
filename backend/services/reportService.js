const { prisma } = require("../db/db");

/**
 * Calculates sales metrics within a specified historical window.
 * @param {string} [shopId] - Optional shop ID context filter.
 * @param {string} interval - Date boundary interval ("daily", "weekly", "monthly", "yearly").
 */
const getSalesSummary = async (shopId, interval) => {
    const boundaryDate = new Date();
    
    switch (interval) {
        case "daily":
            boundaryDate.setHours(0, 0, 0, 0);
            break;
        case "weekly":
            boundaryDate.setDate(boundaryDate.getDate() - 7);
            boundaryDate.setHours(0, 0, 0, 0);
            break;
        case "monthly":
            boundaryDate.setDate(boundaryDate.getDate() - 30);
            boundaryDate.setHours(0, 0, 0, 0);
            break;
        case "yearly":
            boundaryDate.setDate(boundaryDate.getDate() - 365);
            boundaryDate.setHours(0, 0, 0, 0);
            break;
        default:
            throw new Error("Invalid interval specified");
    }

    const whereClause = {
        createdAt: { gte: boundaryDate }
    };
    if (shopId) {
        whereClause.shopId = shopId;
    }

    // Execute aggregation directly in database
    const summary = await prisma.sale.aggregate({
        where: whereClause,
        _count: {
            id: true
        },
        _sum: {
            totalAmount: true
        }
    });

    const totalSales = summary._count.id || 0;
    const totalRevenue = summary._sum.totalAmount || 0.00;
    const averageOrderValue = totalSales > 0 ? parseFloat((totalRevenue / totalSales).toFixed(2)) : 0.00;

    return {
        totalSales,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        averageOrderValue,
        avgOrderValue: averageOrderValue
    };
};

/**
 * Compiles spending and count statistics on merchant supplier stock purchases.
 * @param {string} [shopId] - Optional shop ID context filter.
 */
const getPurchaseSummary = async (shopId) => {
    const whereClause = shopId ? { shopId } : {};

    // 1. Core aggregate values
    const [purchaseAggregate, itemsSum] = await Promise.all([
        prisma.purchase.aggregate({
            where: whereClause,
            _count: {
                id: true
            },
            _sum: {
                totalAmount: true
            }
        }),
        prisma.purchaseItem.aggregate({
            where: shopId ? { purchase: { shopId } } : {},
            _sum: {
                quantity: true
            }
        })
    ]);

    // 2. Spending trends for the last 30 days (grouped daily)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const recentPurchases = await prisma.purchase.findMany({
        where: {
            ...whereClause,
            createdAt: { gte: thirtyDaysAgo }
        },
        select: {
            createdAt: true,
            totalAmount: true
        },
        orderBy: {
            createdAt: "asc"
        }
    });

    // Populate daily index values
    const trendsMap = {};
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        trendsMap[dateStr] = 0.00;
    }

    for (const p of recentPurchases) {
        const dateStr = p.createdAt.toISOString().split("T")[0];
        if (trendsMap[dateStr] !== undefined) {
            trendsMap[dateStr] += p.totalAmount;
        }
    }

    const spendingTrends = Object.entries(trendsMap).map(([date, amount]) => ({
        date,
        amount: parseFloat(amount.toFixed(2))
    }));

    const totalPurchases = purchaseAggregate._count.id || 0;
    const totalSpent = purchaseAggregate._sum.totalAmount || 0.00;
    const avgPerPurchase = totalPurchases > 0 ? parseFloat((totalSpent / totalPurchases).toFixed(2)) : 0.00;

    return {
        totalPurchases,
        totalRevenueSpent: totalSpent,
        totalSpent,
        totalInventoryBought: itemsSum._sum.quantity || 0,
        totalItemsBought: itemsSum._sum.quantity || 0,
        avgPerPurchase,
        spendingTrends
    };
};

/**
 * Calculates financial profit margins and cost metrics by matching sales history against base costs.
 * @param {string} [shopId] - Optional shop ID context filter.
 */
const getProfitSummary = async (shopId) => {
    const whereClause = shopId ? { shopId } : {};

    // 1. Gather all sales amounts and items
    const sales = await prisma.sale.findMany({
        where: whereClause,
        select: {
            totalAmount: true
        }
    });

    const saleItems = await prisma.saleItem.findMany({
        where: shopId ? { sale: { shopId } } : {},
        select: {
            quantity: true,
            productId: true,
            product: {
                select: {
                    purchasePrice: true
                }
            }
        }
    });

    const revenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);

    // 2. Cost of Goods Sold (COGS) calculation
    let costOfGoodsSold = 0.00;
    for (const item of saleItems) {
        const costPerItem = item.product ? item.product.purchasePrice : 0.00;
        costOfGoodsSold += (item.quantity * costPerItem);
    }

    const profit = revenue - costOfGoodsSold;
    const marginPercentage = revenue > 0 ? parseFloat(((profit / revenue) * 100).toFixed(2)) : 0.00;

    return {
        revenue: parseFloat(revenue.toFixed(2)),
        totalRevenue: parseFloat(revenue.toFixed(2)),
        costOfGoodsSold: parseFloat(costOfGoodsSold.toFixed(2)),
        cogs: parseFloat(costOfGoodsSold.toFixed(2)),
        totalCost: parseFloat(costOfGoodsSold.toFixed(2)),
        estimatedProfit: parseFloat(profit.toFixed(2)),
        profit: parseFloat(profit.toFixed(2)),
        marginPercentage,
        marginPercent: marginPercentage,
        profitMargin: marginPercentage
    };
};

/**
 * Compiles the current asset value of inventory.
 * @param {string} [shopId] - Optional shop ID context filter.
 */
const getStockValuation = async (shopId) => {
    const whereClause = {
        isActive: true
    };
    if (shopId) {
        whereClause.shopId = shopId;
    }

    const products = await prisma.product.findMany({
        where: whereClause,
        select: {
            currentStock: true,
            purchasePrice: true,
            sellingPrice: true
        }
    });

    let totalItems = 0;
    let totalAssetCost = 0.00;
    let totalRetailValue = 0.00;

    for (const p of products) {
        totalItems += p.currentStock;
        totalAssetCost += (p.currentStock * p.purchasePrice);
        totalRetailValue += (p.currentStock * p.sellingPrice);
    }

    const potentialProfit = totalRetailValue - totalAssetCost;

    return {
        totalItems,
        totalAssetCost: parseFloat(totalAssetCost.toFixed(2)),
        totalCostValue: parseFloat(totalAssetCost.toFixed(2)),
        totalRetailValue: parseFloat(totalRetailValue.toFixed(2)),
        potentialProfit: parseFloat(potentialProfit.toFixed(2))
    };
};

/**
 * Detects idle stock that has experienced no checkout activity for the past 30 days.
 * @param {string} [shopId] - Optional shop ID context filter.
 */
const getDeadStock = async (shopId) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const whereClauseShop = shopId ? { shopId } : {};

    // 1. Retrieve all product IDs sold in the last 30 days
    const activeSalesItems = await prisma.saleItem.findMany({
        where: {
            sale: {
                ...whereClauseShop,
                createdAt: { gte: thirtyDaysAgo }
            }
        },
        select: {
            productId: true
        }
    });

    const activeProductIds = new Set(activeSalesItems.map(item => item.productId));

    // 2. Fetch all products currently in stock
    const productsInStock = await prisma.product.findMany({
        where: {
            ...whereClauseShop,
            currentStock: { gt: 0 },
            isActive: true
        },
        select: {
            id: true,
            name: true,
            skuCode: true,
            currentStock: true,
            purchasePrice: true,
            createdAt: true
        }
    });

    // 3. Filter programmatically
    const deadProducts = productsInStock.filter(p => !activeProductIds.has(p.id));

    return deadProducts.map(p => ({
        id: p.id,
        name: p.name,
        skuCode: p.skuCode,
        currentStock: p.currentStock,
        unitCost: p.purchasePrice,
        totalCapitalTiedUp: parseFloat((p.currentStock * p.purchasePrice).toFixed(2)),
        addedAt: p.createdAt
    }));
};

/**
 * Ranks active inventory lines according to sales transaction count frequencies.
 * @param {string} [shopId] - Optional shop ID context filter.
 * @param {number} [limit=5] - Number of hot products to return.
 */
const getFastMovingProducts = async (shopId, limit = 5) => {
    const whereClauseShop = shopId ? { sale: { shopId } } : {};

    // Group sale items by product ID and order by count of separate sales
    const aggregations = await prisma.saleItem.groupBy({
        by: ["productId"],
        where: whereClauseShop,
        _count: {
            id: true
        },
        _sum: {
            quantity: true
        },
        orderBy: {
            _count: {
                id: "desc"
            }
        },
        take: limit
    });

    if (aggregations.length === 0) return [];

    const productIds = aggregations.map(a => a.productId);
    const products = await prisma.product.findMany({
        where: {
            id: { in: productIds }
        },
        select: {
            id: true,
            name: true,
            skuCode: true,
            currentStock: true
        }
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    return aggregations.map(agg => {
        const product = productMap.get(agg.productId);
        return {
            productId: agg.productId,
            name: product ? product.name : "Unknown Product",
            skuCode: product ? product.skuCode : "N/A",
            transactionCount: agg._count.id || 0,
            totalQtySold: agg._sum.quantity || 0,
            totalQuantitySold: agg._sum.quantity || 0,
            currentStock: product ? product.currentStock : 0,
            remainingStock: product ? product.currentStock : 0
        };
    });
};

module.exports = {
    getSalesSummary,
    getPurchaseSummary,
    getProfitSummary,
    getStockValuation,
    getDeadStock,
    getFastMovingProducts
};
