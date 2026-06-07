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

/**
 * Sales summary with explicit start and end date (any custom range).
 * Enables cashiers and managers to check any specific day or month.
 */
const getSalesByDateRange = async (shopId, startDate, endDate) => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const where = { createdAt: { gte: start, lte: end } };
    if (shopId) where.shopId = shopId;

    const refundWhere = {
        status: "APPROVED",
        createdAt: { gte: start, lte: end }
    };
    if (shopId) refundWhere.shopId = shopId;

    const [summary, salesList, refundsList] = await Promise.all([
        prisma.sale.aggregate({
            where,
            _count: { id: true },
            _sum: { totalAmount: true }
        }),
        prisma.sale.findMany({
            where,
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                skuCode: true,
                                purchasePrice: true,
                                sellingPrice: true,
                                categoryId: true,
                                categoryRef: { select: { id: true, name: true } }
                            }
                        }
                    }
                },
                creator: { select: { id: true, name: true, role: true } },
                customer: { select: { id: true, name: true, phone: true } }
            },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.refund.findMany({
            where: refundWhere,
            orderBy: { createdAt: 'desc' }
        })
    ]);

    const totalSales = summary._count.id || 0;
    const totalRevenue = summary._sum.totalAmount || 0;

    return {
        totalSales,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        averageOrderValue: totalSales > 0 ? parseFloat((totalRevenue / totalSales).toFixed(2)) : 0,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        transactions: salesList,
        refunds: refundsList
    };
};

/**
 * Get all transactions created by a specific user (cashier's own history).
 * Accessible by cashier, manager, and admin.
 */
const getTransactionsByUser = async (userId, shopId, startDate, endDate) => {
    const where = { createdBy: userId };
    if (shopId) where.shopId = shopId;
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) { const s = new Date(startDate); s.setHours(0,0,0,0); where.createdAt.gte = s; }
        if (endDate) { const e = new Date(endDate); e.setHours(23,59,59,999); where.createdAt.lte = e; }
    }

    const [sales, aggregate] = await Promise.all([
        prisma.sale.findMany({
            where,
            include: {
                items: { include: { product: { select: { id: true, name: true, skuCode: true } } } },
                customer: { select: { id: true, name: true } },
                shop: { select: { id: true, shopName: true } }
            },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.sale.aggregate({
            where,
            _count: { id: true },
            _sum: { totalAmount: true }
        })
    ]);

    return {
        userId,
        totalTransactions: aggregate._count.id || 0,
        totalRevenue: parseFloat((aggregate._sum.totalAmount || 0).toFixed(2)),
        transactions: sales
    };
};

/**
 * How often products are ordered (from PurchaseItems) in a date range.
 * Shows which products are ordered most / least from suppliers.
 */
const getProductOrderFrequency = async (shopId, startDate, endDate) => {
    const where = shopId ? { purchase: { shopId } } : {};
    if (startDate || endDate) {
        where.purchase = { ...(where.purchase || {}), createdAt: {} };
        if (startDate) { const s = new Date(startDate); s.setHours(0,0,0,0); where.purchase.createdAt.gte = s; }
        if (endDate) { const e = new Date(endDate); e.setHours(23,59,59,999); where.purchase.createdAt.lte = e; }
    }

    const aggregations = await prisma.purchaseItem.groupBy({
        by: ['productId'],
        where,
        _count: { id: true },
        _sum: { quantity: true, subtotal: true },
        orderBy: { _sum: { quantity: 'desc' } }
    });

    if (!aggregations.length) return [];

    const productIds = aggregations.map(a => a.productId);
    const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, skuCode: true, currentStock: true }
    });
    const productMap = new Map(products.map(p => [p.id, p]));

    return aggregations.map((agg, idx) => {
        const product = productMap.get(agg.productId);
        return {
            rank: idx + 1,
            productId: agg.productId,
            name: product ? product.name : 'Unknown',
            skuCode: product ? product.skuCode : 'N/A',
            currentStock: product ? product.currentStock : 0,
            orderCount: agg._count.id,
            totalQuantityOrdered: agg._sum.quantity || 0,
            totalSpent: parseFloat((agg._sum.subtotal || 0).toFixed(2))
        };
    });
};

/**
 * Top customers by spend — requires Customer model to be linked to sales.
 */
const getTopCustomers = async (shopId, limit = 10) => {
    const customers = await prisma.customer.findMany({
        where: { shopId },
        include: {
            _count: { select: { sales: true } },
            sales: { select: { totalAmount: true, createdAt: true } }
        }
    });

    return customers
        .map(c => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            email: c.email,
            totalPurchases: c._count.sales,
            totalSpent: parseFloat(c.sales.reduce((acc, s) => acc + s.totalAmount, 0).toFixed(2)),
            lastPurchase: c.sales.length > 0 ? c.sales.sort((a,b) => b.createdAt - a.createdAt)[0].createdAt : null
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, limit);
};

/**
 * Inventory Turnover Ratio = Total COGS / Average Inventory Cost.
 * Industry-standard KPI — higher is better.
 */
const getInventoryTurnover = async (shopId) => {
    const whereClause = shopId ? { shopId } : {};

    const saleItems = await prisma.saleItem.findMany({
        where: shopId ? { sale: { shopId } } : {},
        select: { quantity: true, productId: true, product: { select: { purchasePrice: true } } }
    });

    let cogs = 0;
    for (const item of saleItems) {
        cogs += item.quantity * (item.product?.purchasePrice || 0);
    }

    const products = await prisma.product.findMany({
        where: { ...whereClause, isActive: true },
        select: { currentStock: true, purchasePrice: true }
    });

    const inventoryValue = products.reduce((acc, p) => acc + p.currentStock * p.purchasePrice, 0);
    const turnoverRatio = inventoryValue > 0 ? parseFloat((cogs / inventoryValue).toFixed(2)) : 0;
    // Days Inventory Outstanding — how many days stock lasts
    const dio = turnoverRatio > 0 ? parseFloat((365 / turnoverRatio).toFixed(1)) : 0;

    return {
        cogs: parseFloat(cogs.toFixed(2)),
        currentInventoryValue: parseFloat(inventoryValue.toFixed(2)),
        inventoryTurnoverRatio: turnoverRatio,
        daysInventoryOutstanding: dio,
        interpretation: turnoverRatio >= 6 ? 'Excellent' : turnoverRatio >= 4 ? 'Good' : turnoverRatio >= 2 ? 'Average' : 'Low — consider promotions'
    };
};

/**
 * Stock restocked (received) movements — shows what was resupplied and when.
 */
const getStockRestoredSummary = async (shopId, startDate, endDate) => {
    const where = { type: { in: ['addition', 'receiving'] } };
    if (shopId) where.shopId = shopId;
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) { const s = new Date(startDate); s.setHours(0,0,0,0); where.createdAt.gte = s; }
        if (endDate) { const e = new Date(endDate); e.setHours(23,59,59,999); where.createdAt.lte = e; }
    }

    const movements = await prisma.stockMovement.findMany({
        where,
        include: {
            product: { select: { id: true, name: true, skuCode: true } },
            creator: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    const totalQuantityRestored = movements.reduce((acc, m) => acc + m.quantity, 0);
    return { totalRestockEvents: movements.length, totalQuantityRestored, movements };
};

/**
 * Month-over-month revenue comparison — last 12 months.
 * AI-ready sequential data for trend detection.
 */
const getMonthlyComparison = async (shopId) => {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const where = { createdAt: { gte: twelveMonthsAgo } };
    if (shopId) where.shopId = shopId;

    const sales = await prisma.sale.findMany({
        where,
        select: { createdAt: true, totalAmount: true }
    });

    const monthMap = {};
    for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = d.toISOString().substring(0, 7);
        monthMap[key] = { month: key, revenue: 0, salesCount: 0 };
    }

    for (const sale of sales) {
        const key = sale.createdAt.toISOString().substring(0, 7);
        if (monthMap[key]) {
            monthMap[key].revenue += sale.totalAmount;
            monthMap[key].salesCount += 1;
        }
    }

    const months = Object.values(monthMap).map(m => ({
        ...m,
        revenue: parseFloat(m.revenue.toFixed(2))
    }));

    // Calculate MoM % change
    for (let i = 1; i < months.length; i++) {
        const prev = months[i - 1].revenue;
        const curr = months[i].revenue;
        months[i].momChange = prev > 0 ? parseFloat(((curr - prev) / prev * 100).toFixed(1)) : null;
    }

    return months;
};

module.exports = {
    getSalesSummary,
    getPurchaseSummary,
    getProfitSummary,
    getStockValuation,
    getDeadStock,
    getFastMovingProducts,
    getSalesByDateRange,
    getTransactionsByUser,
    getProductOrderFrequency,
    getTopCustomers,
    getInventoryTurnover,
    getStockRestoredSummary,
    getMonthlyComparison
};
