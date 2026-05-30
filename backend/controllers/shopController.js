const shopService = require("../services/shopService");

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
        const shops = await shopService.getAllShops();
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
        const shop = await shopService.updateShop(req.params.id, req.body);
        res.status(200).json({ success: true, data: shop });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports = { createShop, getShops, getShopById, updateShop };
