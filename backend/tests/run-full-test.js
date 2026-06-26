/**
 * Aroma B2B Integration Test Suite
 * Locality: backend/tests/run-full-test.js
 * 
 * This script runs a complete lifecycle test of the Aroma B2B system.
 * It simulates:
 * 1. Admin Registration & Shop Creation
 * 2. Staff Management (Adding Manager, Cashier, Inventory Staff)
 * 3. Inventory Setup (Creating 30 Categories & 30 Products)
 * 4. Multi-Day Activity (Purchases, Sales, Damages over 3 days)
 * 5. Analytics & AI computation (Daily shop/product metrics, trend scoring)
 * 6. Verification (Dashboard and reports assertion)
 * 7. Automatic cleanup
 */

const { prisma } = require("../db/db");
const { runTrendDetection } = require("../analytics/pipelines/trendDetector");

const API_BASE_URL = "http://localhost:3000/api/v1";
const TIMESTAMP = Date.now();

// Test User Credentials
const testAdmin = {
    name: "Test Admin",
    email: `admin_${TIMESTAMP}@test.com`,
    password: "Password123!"
};

const testManager = {
    name: "Test Manager",
    email: `manager_${TIMESTAMP}@test.com`,
    password: "Password123!",
    role: "manager"
};

const testCashier = {
    name: "Test Cashier",
    email: `cashier_${TIMESTAMP}@test.com`,
    password: "Password123!",
    role: "cashier"
};

const testStaff = {
    name: "Test Staff",
    email: `staff_${TIMESTAMP}@test.com`,
    password: "Password123!",
    role: "staff"
};

// State variables to hold generated IDs and tokens
let adminToken = "";
let managerToken = "";
let cashierToken = "";
let shopId = "";
let categories = []; // { id, name }
let products = [];   // { id, name, categoryId, purchasePrice, sellingPrice }
const supplierId = null;

// Helper function to call backend API
async function apiCall(endpoint, method = "GET", body = null, token = null, customHeaders = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        "Content-Type": "application/json",
        ...customHeaders
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    if (shopId) {
        headers["x-shop-id"] = shopId;
    }

    const options = {
        method,
        headers,
    };
    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(`API error (${response.status}) on ${method} ${endpoint}: ${data.message || JSON.stringify(data)}`);
        }
        return data;
    } catch (err) {
        console.error(`Fetch failed on ${method} ${endpoint}: ${err.message}`);
        throw err;
    }
}

// Parameterized precompute function to backfill shop metrics
async function precomputeForDate(shopId, targetDate) {
    const today = new Date(targetDate);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateKey = today;

    // 1. Fetch aggregates
    const [salesAgg, purchasesAgg, damageAgg, newCustomers] = await Promise.all([
        prisma.sale.aggregate({
            where: { shopId, createdAt: { gte: today, lt: tomorrow } },
            _count: { id: true },
            _sum: { totalAmount: true }
        }),
        prisma.purchase.aggregate({
            where: { shopId, createdAt: { gte: today, lt: tomorrow } },
            _count: { id: true },
            _sum: { totalAmount: true }
        }),
        prisma.damagedStock.aggregate({
            where: { shopId, createdAt: { gte: today, lt: tomorrow } },
            _sum: { valueLost: true }
        }),
        prisma.customer.count({
            where: { shopId, createdAt: { gte: today, lt: tomorrow } }
        })
    ]);

    // Calculate COGS
    const todaySaleItems = await prisma.saleItem.findMany({
        where: { sale: { shopId, createdAt: { gte: today, lt: tomorrow } } },
        select: { quantity: true, product: { select: { purchasePrice: true } } }
    });
    const cogs = todaySaleItems.reduce((acc, item) => acc + item.quantity * (item.product?.purchasePrice || 0), 0);
    const revenue = salesAgg._sum.totalAmount || 0;
    const netProfit = revenue - cogs;
    const grossMargin = revenue > 0 ? parseFloat(((netProfit / revenue) * 100).toFixed(2)) : 0;

    await prisma.dailyShopMetrics.upsert({
        where: { shopId_date: { shopId, date: dateKey } },
        create: {
            shopId,
            date: dateKey,
            totalSalesCount: salesAgg._count.id || 0,
            totalRevenue: parseFloat(revenue.toFixed(2)),
            costOfGoodsSold: parseFloat(cogs.toFixed(2)),
            netProfit: parseFloat(netProfit.toFixed(2)),
            grossMargin,
            totalPurchases: purchasesAgg._count.id || 0,
            purchaseExpenses: parseFloat((purchasesAgg._sum.totalAmount || 0).toFixed(2)),
            totalDamageValue: parseFloat((damageAgg._sum.valueLost || 0).toFixed(2)),
            newCustomers
        },
        update: {
            totalSalesCount: salesAgg._count.id || 0,
            totalRevenue: parseFloat(revenue.toFixed(2)),
            costOfGoodsSold: parseFloat(cogs.toFixed(2)),
            netProfit: parseFloat(netProfit.toFixed(2)),
            grossMargin,
            totalPurchases: purchasesAgg._count.id || 0,
            purchaseExpenses: parseFloat((purchasesAgg._sum.totalAmount || 0).toFixed(2)),
            totalDamageValue: parseFloat((damageAgg._sum.valueLost || 0).toFixed(2)),
            newCustomers
        }
    });

    // 2. DailyProductPerformance
    const productAggs = await prisma.saleItem.groupBy({
        by: ["productId"],
        where: { sale: { shopId, createdAt: { gte: today, lt: tomorrow } } },
        _sum: { quantity: true, subtotal: true },
        _count: { id: true }
    });

    for (const agg of productAggs) {
        await prisma.dailyProductPerformance.upsert({
            where: { productId_date: { productId: agg.productId, date: dateKey } },
            create: {
                productId: agg.productId,
                shopId,
                date: dateKey,
                quantitySold: agg._sum.quantity || 0,
                revenue: parseFloat((agg._sum.subtotal || 0).toFixed(2)),
                unitsSold: agg._count.id || 0
            },
            update: {
                quantitySold: agg._sum.quantity || 0,
                revenue: parseFloat((agg._sum.subtotal || 0).toFixed(2)),
                unitsSold: agg._count.id || 0
            }
        });
    }
}

async function runTests() {
    console.log("🚀 Starting Aroma B2B Backend Integration Test Suite...\n");

    try {
        // --- STEP 1: Register & Log in Admin ---
        console.log("👤 [Step 1] Registering Admin account...");
        const registerRes = await apiCall("/auth/register", "POST", testAdmin);
        console.log(`   ✅ Admin registered: ${registerRes.data.email}`);

        console.log("🔑 Logging in as Admin...");
        const loginRes = await apiCall("/auth/login", "POST", {
            email: testAdmin.email,
            password: testAdmin.password
        });
        adminToken = loginRes.data.token;
        console.log("   ✅ Admin logged in successfully!");

        // --- STEP 2: Create Shop ---
        console.log("\n🏪 [Step 2] Creating Shop...");
        const shopRes = await apiCall("/shops", "POST", {
            shopName: `Test Aroma B2B Shop ${TIMESTAMP}`,
            businessType: "Wholesale",
            address: "456 Test Street, Bengaluru, Karnataka",
            phone: "+919876543210"
        }, adminToken);
        shopId = shopRes.data.id;
        console.log(`   ✅ Shop Created: "${shopRes.data.name}" (ID: ${shopId})`);

        // --- STEP 3: Add Staff Users ---
        console.log("\n👥 [Step 3] Creating staff members...");

        // Create Manager
        console.log("   Creating Manager...");
        const managerRes = await apiCall("/users", "POST", testManager, adminToken);
        console.log(`      ✅ Manager created: ${managerRes.data.email}`);

        // Create Cashier
        console.log("   Creating Cashier...");
        const cashierRes = await apiCall("/users", "POST", testCashier, adminToken);
        console.log(`      ✅ Cashier created: ${cashierRes.data.email}`);

        // Create Worker/Staff
        console.log("   Creating Worker/Staff...");
        const staffRes = await apiCall("/users", "POST", testStaff, adminToken);
        console.log(`      ✅ Worker created: ${staffRes.data.email}`);

        // Verify Roles
        console.log("   🔑 Logging in as Manager...");
        const managerLogin = await apiCall("/auth/login", "POST", {
            email: testManager.email,
            password: testManager.password,
            shopIdentifier: shopId
        });
        managerToken = managerLogin.data.token;
        console.log("      ✅ Manager logged in successfully!");

        console.log("   🔑 Logging in as Cashier...");
        const cashierLogin = await apiCall("/auth/login", "POST", {
            email: testCashier.email,
            password: testCashier.password,
            shopIdentifier: shopId
        });
        cashierToken = cashierLogin.data.token;
        console.log("      ✅ Cashier logged in successfully!");

        // --- STEP 4: Create Categories (Min 30 Categories) ---
        console.log("\n📦 [Step 4] Creating 30 Categories...");
        for (let i = 1; i <= 30; i++) {
            const catName = `Test Category ${String(i).padStart(2, '0')}`;
            const catRes = await apiCall("/categories", "POST", { name: catName, shopId }, managerToken);
            categories.push({ id: catRes.data.id, name: catRes.data.name });
        }
        console.log(`   ✅ Created ${categories.length} categories successfully!`);

        // --- STEP 5: Create Products with Initial Stock 100 ---
        console.log("\n📦 [Step 5] Creating 30 Products (1 per category) with 100 stock...");
        for (let i = 0; i < 30; i++) {
            const prodName = `Test Product ${String(i + 1).padStart(2, '0')}`;
            const skuCode = `SKU-TEST-${TIMESTAMP}-${i + 1}`;
            const purchasePrice = 100.0; // ₹100 cost price
            const sellingPrice = 150.0;  // ₹150 sell price
            
            const prodRes = await apiCall("/products", "POST", {
                categoryId: categories[i].id,
                name: prodName,
                skuCode,
                purchasePrice,
                sellingPrice,
                currentStock: 100.0,
                minimumStock: 5.0,
                shopId
            }, managerToken);

            products.push({
                id: prodRes.data.id,
                name: prodRes.data.name,
                categoryId: categories[i].id,
                purchasePrice,
                sellingPrice
            });
        }
        console.log(`   ✅ Created ${products.length} products with stock = 100.0 successfully!`);

        // --- STEP 6: Execute 18 Purchases and 18 Sales over 3 Days ---
        console.log("\n📈 [Step 6] Simulating 3 Days of Sales, Purchases and Damages...");

        const day1 = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
        const day2 = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago
        const day3 = new Date(); // Today

        const dayLabels = ["Day 1 (2 Days Ago)", "Day 2 (Yesterday)", "Day 3 (Today)"];
        const targetDates = [day1, day2, day3];

        for (let d = 0; d < 3; d++) {
            console.log(`   👉 Running transactions for ${dayLabels[d]}...`);
            const date = targetDates[d];

            // 6 Purchases & 6 Sales per day
            for (let t = 0; t < 6; t++) {
                // Determine a unique product for this transaction
                const productIndex = (d * 6 + t) % products.length;
                const prod = products[productIndex];

                // Create Purchase via API
                const purchaseRes = await apiCall("/purchases", "POST", {
                    shopId,
                    supplierName: "Test Supplier",
                    items: [{ productId: prod.id, quantity: 10, purchasePrice: prod.purchasePrice }]
                }, managerToken);

                // Create Sale via API
                const saleRes = await apiCall("/sales", "POST", {
                    shopId,
                    customerName: "Test Customer",
                    paymentMethod: "cash",
                    items: [{ productId: prod.id, quantity: 5, sellingPrice: prod.sellingPrice }]
                }, cashierToken);

                // Backdate Sale, Purchase and their StockMovements
                await prisma.purchase.update({
                    where: { id: purchaseRes.data.id },
                    data: { createdAt: date }
                });
                await prisma.stockMovement.updateMany({
                    where: { referenceType: "purchase", referenceId: purchaseRes.data.id },
                    data: { createdAt: date }
                });

                await prisma.sale.update({
                    where: { id: saleRes.data.id },
                    data: { createdAt: date }
                });
                await prisma.stockMovement.updateMany({
                    where: { referenceType: "sale", referenceId: saleRes.data.id },
                    data: { createdAt: date }
                });
            }

            // Report Damaged Stock on Day 2 and Day 3
            if (d === 1) {
                // Day 2 Damage Reports
                const damageRes1 = await apiCall("/damaged-stock", "POST", {
                    shopId,
                    productId: products[0].id,
                    quantity: 2,
                    reason: "broken"
                }, managerToken);

                const damageRes2 = await apiCall("/damaged-stock", "POST", {
                    shopId,
                    productId: products[1].id,
                    quantity: 3,
                    reason: "expired"
                }, managerToken);

                await prisma.damagedStock.update({ where: { id: damageRes1.data.id }, data: { createdAt: date } });
                await prisma.stockMovement.updateMany({ where: { referenceType: "damage_report", referenceId: damageRes1.data.id }, data: { createdAt: date } });

                await prisma.damagedStock.update({ where: { id: damageRes2.data.id }, data: { createdAt: date } });
                await prisma.stockMovement.updateMany({ where: { referenceType: "damage_report", referenceId: damageRes2.data.id }, data: { createdAt: date } });
            } else if (d === 2) {
                // Day 3 Damage Report
                const damageRes = await apiCall("/damaged-stock", "POST", {
                    shopId,
                    productId: products[2].id,
                    quantity: 1,
                    reason: "handling_error"
                }, managerToken);

                await prisma.damagedStock.update({ where: { id: damageRes.data.id }, data: { createdAt: date } });
                await prisma.stockMovement.updateMany({ where: { referenceType: "damage_report", referenceId: damageRes.data.id }, data: { createdAt: date } });
            }

            console.log(`      ✅ Transactions created and backdated for ${dayLabels[d]}`);
        }

        // --- STEP 7: Run Daily Precomputations ---
        console.log("\n📊 [Step 7] Running nightly metrics precomputation for all 3 days...");
        for (let d = 0; d < 3; d++) {
            const date = targetDates[d];
            await precomputeForDate(shopId, date);
            console.log(`      ✅ Daily metrics computed for ${dayLabels[d]}`);
        }

        // --- STEP 8: Run Trend Detection Pipeline ---
        console.log("\n🧠 [Step 8] Triggering AI trend detection pipeline...");
        const trendResult = await runTrendDetection(shopId);
        console.log(`   ✅ Trend scoring completed!`);
        console.log(`      Processed: ${trendResult.processed} products`);
        console.log(`      Trending Up / Growing: ${trendResult.trending}`);
        console.log(`      Declining: ${trendResult.declining}`);
        console.log(`      At Risk: ${trendResult.atRisk}`);

        // --- STEP 9: Verify Dashboard and Reports ---
        console.log("\n🧪 [Step 9] Verifying system state and calculations...");

        // Verify product stock calculations:
        // Initial Stock = 100.
        // For each day, we did a purchase of +10 and a sale of -5.
        // Total purchases: 3 days * 10 = +30.
        // Total sales: 3 days * 5 = -15.
        // Damages: Product 0 lost 2 (Day 2), Product 1 lost 3 (Day 2), Product 2 lost 1 (Day 3).
        // Let's verify Product 0 stock: 100 + 30 - 15 - 2 = 113.
        const prod0 = await prisma.product.findUnique({ where: { id: products[0].id } });
        console.log(`   Asserting stock level of Product 0 (Expected: 113, Actual: ${prod0.currentStock})...`);
        if (prod0.currentStock !== 113) {
            throw new Error(`Stock mismatch on Product 0. Expected 113, got ${prod0.currentStock}`);
        }
        console.log("      ✅ Stock assertion passed!");

        // Hit dashboard endpoint
        const dashboardData = await apiCall(`/dashboard?shopId=${shopId}`, "GET", null, managerToken);
        console.log("   Asserting Dashboard Data...");
        console.log(`      Total Revenue retrieved: ₹${dashboardData.data?.totalRevenue || 0}`);
        console.log(`      Total Sales Count retrieved: ${dashboardData.data?.totalSalesCount || 0}`);
        console.log(`      Net Profit retrieved: ₹${dashboardData.data?.netProfit || 0}`);
        if (dashboardData.data?.totalSalesCount === 0) {
            throw new Error("Dashboard reports 0 sales count, metrics calculations failed");
        }
        console.log("      ✅ Dashboard metrics assertion passed!");

        // Hit low stock endpoint
        const lowStock = await apiCall(`/products/low-stock?shopId=${shopId}`, "GET", null, managerToken);
        console.log(`   Asserting Low Stock endpoint (Expected: 0 items since stock is ~113-115, Actual: ${lowStock.data.length} items)...`);
        if (lowStock.data.length !== 0) {
            throw new Error(`Low stock mismatch. Expected 0, got ${lowStock.data.length}`);
        }
        console.log("      ✅ Low stock assertion passed!");

        console.log("\n🎉 ALL TESTS COMPLETED SUCCESSFULLY! The system is fully operational and correct.");

    } catch (error) {
        console.error("\n❌ TESTS FAILED!");
        console.error(error);
        process.exitCode = 1;
    } finally {
        // --- STEP 10: Cleanup Test Data ---
        console.log("\n🧼 [Step 10] Cleaning up database test records...");
        try {
            if (shopId) {
                // Cascade delete will delete everything associated with the shop
                await prisma.shop.delete({ where: { id: shopId } });
                console.log("   ✅ Test Shop deleted (Cascade deleted categories, products, sales, purchases, stock movements, and metrics)");
            }
            const testEmails = [testAdmin.email, testManager.email, testCashier.email, testStaff.email];
            await prisma.user.deleteMany({
                where: { email: { in: testEmails } }
            });
            console.log("   ✅ Test User Accounts deleted");
            console.log("✨ Cleanup finished!");
        } catch (cleanupErr) {
            console.error(`⚠️ Cleanup failed: ${cleanupErr.message}`);
        }
    }
}

// Execute the tests
runTests();
