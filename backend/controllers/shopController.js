const shopService = require("../services/shopService");
const { prisma } = require("../db/db");

const createShop = async (req, res) => {
    try {
        const shop = await shopService.createShop(req.body, req.user.id);
        res.status(201).json({ success: true, data: shop });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const getShops = async (req, res) => {
    try {
        const shops = await shopService.getAllShops(req.user.id);
        res.status(200).json({ success: true, data: shops });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getShopById = async (req, res) => {
    try {
        const shop = await shopService.getShopById(req.params.id);
        res.status(200).json({ success: true, data: shop });
    } catch (err) {
        res.status(404).json({ success: false, message: err.message });
    }
};

const updateShop = async (req, res) => {
    try {
        const shopId = req.params.id;
        const existingShop = await prisma.shop.findUnique({
            where: { id: shopId }
        });
        if (!existingShop) {
            return res.status(404).json({ success: false, message: "Shop not found" });
        }
        if (existingShop.ownerId !== req.user.id) {
            return res.status(403).json({ success: false, message: "Forbidden: Only the owner can modify this shop" });
        }
        const shop = await shopService.updateShop(shopId, req.body);
        res.status(200).json({ success: true, data: shop });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports = { createShop, getShops, getShopById, updateShop };
