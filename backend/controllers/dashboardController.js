const dashboardService = require("../services/dashboardService");
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

const getSummary = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const data = await dashboardService.getSummary(shopId);
        res.status(200).json({
            success: true,
            message: "Dashboard summary retrieved successfully",
            data
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getRecentSales = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const data = await dashboardService.getRecentSales(shopId, limit);
        res.status(200).json({
            success: true,
            message: "Recent checkout transactions retrieved",
            data
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getTopProducts = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const limit = req.query.limit ? parseInt(req.query.limit) : 5;
        const data = await dashboardService.getTopProducts(shopId, limit);
        res.status(200).json({
            success: true,
            message: "Top revenue-generating products retrieved",
            data
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getLowStock = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const data = await dashboardService.getLowStock(shopId);
        res.status(200).json({
            success: true,
            message: "Low stock alert notifications compiled",
            data
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getSalesChart = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const data = await dashboardService.getSalesChart(shopId);
        res.status(200).json({
            success: true,
            message: "Timeline sales aggregation chart data compiled",
            data
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    getSummary,
    getRecentSales,
    getTopProducts,
    getLowStock,
    getSalesChart
};
