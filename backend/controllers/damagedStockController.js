const damagedStockService = require("../services/damagedStockService");
const { prisma } = require("../db/db");

const resolveShopContext = async (req) => {
    if (req.shopId) return req.shopId;
    if (req.headers["x-shop-id"]) return req.headers["x-shop-id"];
    if (req.user.role === "admin") return req.query.shopId || null;
    if (req.query.shopId) {
        const owned = await prisma.shop.findFirst({
            where: { id: req.query.shopId, ownerId: req.user.id }, select: { id: true }
        });
        if (owned) return owned.id;
    }
    const ownedShop = await prisma.shop.findFirst({
        where: { ownerId: req.user.id }, orderBy: { createdAt: "asc" }, select: { id: true }
    });
    return ownedShop ? ownedShop.id : "00000000-0000-0000-0000-000000000000";
};

const reportDamage = async (req, res) => {
    try {
        const shopId = req.body.shopId || req.query.shopId || req.shopId;
        if (!shopId) return res.status(400).json({ success: false, message: "shopId is required" });
        const data = await damagedStockService.reportDamage({ ...req.body, shopId }, req.user.id);
        res.status(201).json({ success: true, message: "Damage report recorded and stock adjusted", data });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const getAllDamageReports = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const { startDate, endDate } = req.query;
        const data = await damagedStockService.getAllDamageReports(shopId, startDate, endDate);
        res.status(200).json({ success: true, message: "Damage reports retrieved", data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getDamageSummary = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const { startDate, endDate } = req.query;
        const data = await damagedStockService.getDamageSummary(shopId, startDate, endDate);
        res.status(200).json({ success: true, message: "Damage summary retrieved", data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getDamageByProduct = async (req, res) => {
    try {
        const data = await damagedStockService.getDamageByProduct(req.params.productId);
        res.status(200).json({ success: true, message: "Product damage history retrieved", data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { reportDamage, getAllDamageReports, getDamageSummary, getDamageByProduct };
