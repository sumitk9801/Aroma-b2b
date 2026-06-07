const reportService = require("../services/reportService");
const { prisma } = require("../db/db");

/**
 * Resolves the appropriate shop filter context based on the requester's role.
 * If the user is not a global 'admin', their metrics are strictly locked to shops they own.
 * @param {object} req - Express request object.
 */
const resolveShopContext = async (req) => {
    if (req.shopId) return req.shopId;
    if (req.headers["x-shop-id"]) return req.headers["x-shop-id"];
    // If global admin, respect query shopId parameter (if supplied)
    if (req.user.role === "admin") {
        return req.query.shopId || null;
    }

    // Support filtering by a specific shop if the user owns it
    if (req.query.shopId) {
        const owned = await prisma.shop.findFirst({
            where: { id: req.query.shopId, ownerId: req.user.id },
            select: { id: true }
        });
        if (owned) return owned.id;
    }

    // Otherwise, fetch the primary shop owned by this user (first created)
    const ownedShop = await prisma.shop.findFirst({
        where: { ownerId: req.user.id },
        orderBy: { createdAt: "asc" },
        select: { id: true }
    });

    // If they own no shop, restrict them by returning a non-matching ID
    return ownedShop ? ownedShop.id : "00000000-0000-0000-0000-000000000000";
};

const getSalesSummary = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const interval = req.query.interval || "monthly";
        const data = await reportService.getSalesSummary(shopId, interval);
        res.status(200).json({
            success: true,
            message: `Sales summary report (${interval}) retrieved`,
            data
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getPurchaseSummary = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const data = await reportService.getPurchaseSummary(shopId);
        res.status(200).json({
            success: true,
            message: "Purchase expenditure report retrieved",
            data
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getProfitSummary = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const data = await reportService.getProfitSummary(shopId);
        res.status(200).json({
            success: true,
            message: "Net profit summary margins compiled",
            data
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getStockValuation = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const data = await reportService.getStockValuation(shopId);
        res.status(200).json({
            success: true,
            message: "Current inventory asset valuation report compiled",
            data
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getDeadStock = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const data = await reportService.getDeadStock(shopId);
        res.status(200).json({
            success: true,
            message: "Idle/dead stock analysis retrieved",
            data
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getFastMovingProducts = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const limit = req.query.limit ? parseInt(req.query.limit) : 5;
        const data = await reportService.getFastMovingProducts(shopId, limit);
        res.status(200).json({
            success: true,
            message: "High velocity inventory items ranked",
            data
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── New Extended Reporting Endpoints ───────────────────────────────────────

/**
 * Custom date-range sales query.
 * Access: ADMIN, MANAGER (own shop), CASHIER (own transactions only via /my-transactions).
 */
const getSalesByDateRange = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ success: false, message: "startDate and endDate are required (YYYY-MM-DD)" });
        }
        const data = await reportService.getSalesByDateRange(shopId, startDate, endDate);
        res.status(200).json({ success: true, message: "Sales by date range retrieved", data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Personal transaction history for the logged-in user.
 * Access: ALL ROLES — each user sees only their own transactions.
 */
const getMyTransactions = async (req, res) => {
    try {
        const shopId = req.query.shopId || null;
        const { startDate, endDate } = req.query;
        const data = await reportService.getTransactionsByUser(req.user.id, shopId, startDate, endDate);
        res.status(200).json({ success: true, message: "Your transaction history retrieved", data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Product ordering frequency from suppliers.
 * Access: ADMIN, MANAGER.
 */
const getProductOrderFrequency = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const { startDate, endDate } = req.query;
        const data = await reportService.getProductOrderFrequency(shopId, startDate, endDate);
        res.status(200).json({ success: true, message: "Product order frequency report retrieved", data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Top customers by total spend.
 * Access: ADMIN, MANAGER.
 */
const getTopCustomers = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const data = await reportService.getTopCustomers(shopId, limit);
        res.status(200).json({ success: true, message: "Top customers by spend retrieved", data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Inventory turnover ratio and DIO (Days Inventory Outstanding).
 * Access: ADMIN only.
 */
const getInventoryTurnover = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const data = await reportService.getInventoryTurnover(shopId);
        res.status(200).json({ success: true, message: "Inventory turnover KPI computed", data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Stock restocked/received summary over a date range.
 * Access: ADMIN, MANAGER.
 */
const getStockRestoredSummary = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const { startDate, endDate } = req.query;
        const data = await reportService.getStockRestoredSummary(shopId, startDate, endDate);
        res.status(200).json({ success: true, message: "Stock restored summary retrieved", data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Month-over-month comparison for last 12 months (AI-ready sequential data).
 * Access: ADMIN, MANAGER.
 */
const getMonthlyComparison = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const data = await reportService.getMonthlyComparison(shopId);
        res.status(200).json({ success: true, message: "Monthly revenue comparison retrieved", data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    getSalesSummary,
    getPurchaseSummary,
    getProfitSummary,
    getStockValuation,
    getDeadStock,
    getFastMovingProducts,
    getSalesByDateRange,
    getMyTransactions,
    getProductOrderFrequency,
    getTopCustomers,
    getInventoryTurnover,
    getStockRestoredSummary,
    getMonthlyComparison
};
