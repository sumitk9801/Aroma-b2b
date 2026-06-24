const { prisma } = require("./db/db");
const { runTrendDetection } = require("./analytics/pipelines/trendDetector");

async function seed() {
    console.log("Starting Intelligence & Analytics seeding pipeline...");

    // 1. Get or create a default shop
    let shop = await prisma.shop.findFirst();
    if (!shop) {
        console.log("No shop found, creating a default B2B shop...");
        shop = await prisma.shop.create({
            data: {
                shopName: "Aroma B2B Wholesale",
                businessType: "Wholesale Cosmetics",
                address: "123 Fragrance Lane, Perfume District",
                phone: "+1-555-0199",
            }
        });
    }
    console.log(`Using Shop: ${shop.shopName} (${shop.id})`);

    // 2. Get or create products
    let products = await prisma.product.findMany({ where: { shopId: shop.id } });
    if (products.length === 0) {
        console.log("No products found, seeding default active products...");
        const defaultProducts = [
            { name: "Aroma Classic 500ml", skuCode: "ARM-CLS-500", purchasePrice: 15.0, sellingPrice: 25.0, currentStock: 150.0, minimumStock: 20.0 },
            { name: "Lavender Mist 200ml", skuCode: "LAV-MST-200", purchasePrice: 8.0, sellingPrice: 14.0, currentStock: 80.0, minimumStock: 15.0 },
            { name: "Premium Jasmine Set", skuCode: "PREM-JAS-SET", purchasePrice: 35.0, sellingPrice: 60.0, currentStock: 40.0, minimumStock: 10.0 },
            { name: "Sandalwood Aroma Oil", skuCode: "SND-OIL-050", purchasePrice: 20.0, sellingPrice: 38.0, currentStock: 12.0, minimumStock: 12.0 },
            { name: "Rosewater Spray 100ml", skuCode: "ROSE-SPR-100", purchasePrice: 5.0, sellingPrice: 9.0, currentStock: 300.0, minimumStock: 25.0 },
            { name: "Citrus Cologne 50ml", skuCode: "CTR-COL-050", purchasePrice: 12.0, sellingPrice: 22.0, currentStock: 180.0, minimumStock: 15.0 },
        ];

        // We need category
        let category = await prisma.category.findFirst({ where: { shopId: shop.id } });
        if (!category) {
            category = await prisma.category.create({
                data: {
                    shopId: shop.id,
                    name: "Essential Oils & Sprays",
                }
            });
        }

        for (const dp of defaultProducts) {
            const prod = await prisma.product.create({
                data: {
                    shopId: shop.id,
                    categoryId: category.id,
                    name: dp.name,
                    skuCode: dp.skuCode,
                    purchasePrice: dp.purchasePrice,
                    sellingPrice: dp.sellingPrice,
                    currentStock: dp.currentStock,
                    minimumStock: dp.minimumStock,
                    isActive: true,
                }
            });
            products.push(prod);
        }
    }
    console.log(`Loaded ${products.length} products for analytics.`);

    // 3. Check for existing Sales and Purchases
    const salesCount = await prisma.sale.count({ where: { shopId: shop.id } });
    if (salesCount < 20) {
        console.log("Generating 60 days of historical sales and purchases to simulate realistic demand...");
        
        // Find or create a user to act as creator
        let user = await prisma.user.findFirst();
        if (!user) {
            console.log("No user found. Please ensure you register or log in first so we have a user context, or we'll create a system user.");
            user = await prisma.user.create({
                data: {
                    name: "System Bot",
                    email: "system@aroma.com",
                    password: "$2b$10$xyz", // Dummy hashed pass
                    role: "admin",
                }
            });
        }

        // Loop over the last 60 days
        for (let i = 60; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(12, 0, 0, 0); // Noon

            // Decide how many sales/purchases today
            // Weekends have more sales
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const salesToday = isWeekend ? Math.floor(Math.random() * 5) + 3 : Math.floor(Math.random() * 3) + 1;

            // Generate sales
            for (let s = 0; s < salesToday; s++) {
                const saleItems = [];
                let totalAmount = 0;

                // Pick 1 to 3 random products
                const numItems = Math.floor(Math.random() * 3) + 1;
                const shuffledProds = [...products].sort(() => 0.5 - Math.random());
                
                for (let k = 0; k < numItems; k++) {
                    const prod = shuffledProds[k];
                    // Introduce trend pattern: Jasmine has rising sales recently, Rosewater has declining sales
                    let baseQty = Math.floor(Math.random() * 8) + 1;
                    if (prod.skuCode === "PREM-JAS-SET" && i < 15) {
                        // Jasmine set sales increase by 3x in the last 15 days (trending up)
                        baseQty = Math.floor(Math.random() * 12) + 8;
                    }
                    if (prod.skuCode === "ROSE-SPR-100" && i < 20) {
                        // Rosewater sales decline to near zero in the last 20 days (declining)
                        baseQty = Math.random() > 0.8 ? 1 : 0;
                    }

                    if (baseQty > 0) {
                        const subtotal = baseQty * prod.sellingPrice;
                        totalAmount += subtotal;
                        saleItems.push({
                            productId: prod.id,
                            quantity: baseQty,
                            sellingPrice: prod.sellingPrice,
                            subtotal: subtotal
                        });
                    }
                }

                if (saleItems.length > 0) {
                    await prisma.sale.create({
                        data: {
                            shopId: shop.id,
                            totalAmount: totalAmount,
                            createdBy: user.id,
                            createdAt: date,
                            updatedAt: date,
                            items: {
                                create: saleItems
                            }
                        }
                    });
                }
            }

            // Generate occasional supplier purchases to restock
            if (i % 7 === 0) {
                // Every 7 days, make a purchase order to restock
                let purchaseAmount = 0;
                const purchaseItems = [];
                for (const prod of products) {
                    // Restock 20 to 50 units
                    const qty = Math.floor(Math.random() * 31) + 20;
                    const subtotal = qty * prod.purchasePrice;
                    purchaseAmount += subtotal;
                    purchaseItems.push({
                        productId: prod.id,
                        quantity: qty,
                        purchasePrice: prod.purchasePrice,
                        subtotal: subtotal
                    });
                }

                await prisma.purchase.create({
                    data: {
                        shopId: shop.id,
                        totalAmount: purchaseAmount,
                        createdBy: user.id,
                        createdAt: date,
                        updatedAt: date,
                        items: {
                            create: purchaseItems
                        }
                    }
                });
            }
        }
    }

    // 4. Precompute daily metrics and daily performance tables
    console.log("Clearing old precomputed daily analytics metrics...");
    await prisma.dailyShopMetrics.deleteMany({ where: { shopId: shop.id } });
    await prisma.dailyProductPerformance.deleteMany({ where: { shopId: shop.id } });
    await prisma.productTrendScore.deleteMany({ where: { shopId: shop.id } });

    console.log("Precomputing daily metrics for the last 60 days sequentially...");
    for (let i = 60; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0); // Start of day

        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        // Aggregate Sales
        const [salesAgg, purchasesAgg, newCustomers] = await Promise.all([
            prisma.sale.aggregate({
                where: { shopId: shop.id, createdAt: { gte: date, lt: nextDay } },
                _count: { id: true },
                _sum: { totalAmount: true }
            }),
            prisma.purchase.aggregate({
                where: { shopId: shop.id, createdAt: { gte: date, lt: nextDay } },
                _count: { id: true },
                _sum: { totalAmount: true }
            }),
            prisma.customer.count({
                where: { shopId: shop.id, createdAt: { gte: date, lt: nextDay } }
            })
        ]);

        const todaySaleItems = await prisma.saleItem.findMany({
            where: { sale: { shopId: shop.id, createdAt: { gte: date, lt: nextDay } } },
            select: { quantity: true, product: { select: { purchasePrice: true } } }
        });

        const cogs = todaySaleItems.reduce((acc, item) => acc + item.quantity * (item.product?.purchasePrice || 0), 0);
        const revenue = salesAgg._sum.totalAmount || 0;
        const netProfit = revenue - cogs;
        const grossMargin = revenue > 0 ? parseFloat(((netProfit / revenue) * 100).toFixed(2)) : 0;

        // Create Shop Metrics
        await prisma.dailyShopMetrics.create({
            data: {
                shopId: shop.id,
                date: date,
                totalSalesCount: salesAgg._count.id || 0,
                totalRevenue: parseFloat(revenue.toFixed(2)),
                costOfGoodsSold: parseFloat(cogs.toFixed(2)),
                netProfit: parseFloat(netProfit.toFixed(2)),
                grossMargin,
                totalPurchases: purchasesAgg._count.id || 0,
                purchaseExpenses: parseFloat((purchasesAgg._sum.totalAmount || 0).toFixed(2)),
                totalDamageValue: 0.0,
                newCustomers
            }
        });

        // Create Product Performance
        const productAggs = await prisma.saleItem.groupBy({
            by: ["productId"],
            where: { sale: { shopId: shop.id, createdAt: { gte: date, lt: nextDay } } },
            _sum: { quantity: true, subtotal: true },
            _count: { id: true }
        });

        for (const agg of productAggs) {
            await prisma.dailyProductPerformance.create({
                data: {
                    productId: agg.productId,
                    shopId: shop.id,
                    date: date,
                    quantitySold: agg._sum.quantity || 0,
                    revenue: parseFloat((agg._sum.subtotal || 0).toFixed(2)),
                    unitsSold: agg._count.id || 0
                }
            });
        }
    }
    console.log("Daily precomputations complete for last 60 days.");

    // 5. Run Trend Detection Pipeline
    console.log("Executing trend detection pipeline to score products...");
    const trendResult = await runTrendDetection(shop.id);
    console.log("Trend detection complete:", trendResult);

    console.log("\nSeeding pipeline ran successfully! Please refresh your browser or reload the page to see live precomputed historical records, ABC classes, and predictive charts.");
}

seed()
    .catch((err) => {
        console.error("FATAL ERROR running seed pipeline:", err);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
