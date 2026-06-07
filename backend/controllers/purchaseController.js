const purchaseService = require("../services/purchaseService");

const createPurchase = async (req, res) => {
    try {
        const purchase = await purchaseService.createPurchase(req.body, req.user.id);
        res.status(201).json({ success: true, data: purchase });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const getPurchases = async (req, res) => {
    try {
        const finalShopId = req.shopId || req.query.shopId;
        const purchases = await purchaseService.getAllPurchases(finalShopId);
        res.status(200).json({ success: true, data: purchases });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getPurchaseById = async (req, res) => {
    try {
        const purchase = await purchaseService.getPurchaseById(req.params.id);
        res.status(200).json({ success: true, data: purchase });
    } catch (err) {
        res.status(404).json({ success: false, message: err.message });
    }
};

const getPurchasesByProduct = async (req, res) => {
    try {
        const items = await purchaseService.getPurchasesByProduct(req.params.productId);
        res.status(200).json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { createPurchase, getPurchases, getPurchaseById, getPurchasesByProduct };
