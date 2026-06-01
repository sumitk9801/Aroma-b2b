const saleService = require("../services/saleService");
const { prisma } = require("../db/db");

const resolveShopContext = async (req) => {
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

    return ownedShop ? ownedShop.id : "00000000-0000-0000-0000-000000000000";
};

const createSale = async (req, res) => {
    try {
        const sale = await saleService.createSale(req.body, req.user.id);
        res.status(201).json({ success: true, data: sale });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const getSales = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const sales = await saleService.getAllSales(shopId);
        res.status(200).json({ success: true, data: sales });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getSaleById = async (req, res) => {
    try {
        const sale = await saleService.getSaleById(req.params.id);
        res.status(200).json({ success: true, data: sale });
    } catch (err) {
        res.status(404).json({ success: false, message: err.message });
    }
};

const getSalesByProduct = async (req, res) => {
    try {
        const items = await saleService.getSalesByProduct(req.params.productId);
        res.status(200).json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getDailySales = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const daily = await saleService.getDailySales(shopId);
        res.status(200).json({ success: true, data: daily });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getMonthlySales = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const monthly = await saleService.getMonthlySales(shopId);
        res.status(200).json({ success: true, data: monthly });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { createSale, getSales, getSaleById, getSalesByProduct, getDailySales, getMonthlySales };
