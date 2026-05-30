const reportService = require("../services/reportService");
const { prisma } = require("../db/db");

/**
 * Resolves the appropriate shop filter context based on the requester's role.
 * If the user is not a global 'admin', their metrics are strictly locked to shops they own.
 * @param {object} req - Express request object.
 */
const resolveShopContext = async (req) => {
    // If global admin, respect query shopId parameter (if supplied)
    if (req.user.role === "admin") {
        return req.query.shopId || null;
    }

    // Otherwise, fetch the shop owned by this user
    const ownedShop = await prisma.shop.findFirst({
        where: { ownerId: req.user.id },
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

module.exports = {
    getSalesSummary,
    getPurchaseSummary,
    getProfitSummary,
    getStockValuation,
    getDeadStock,
    getFastMovingProducts
};
