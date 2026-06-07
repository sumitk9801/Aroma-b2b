const stockMovementService = require("../services/stockMovementService");

const getStockMovements = async (req, res) => {
    try {
        const finalShopId = req.shopId || req.query.shopId;
        const filters = {
            referenceType: req.query.referenceType,
            type: req.query.type,
        };
        const movements = await stockMovementService.getAllStockMovements(finalShopId, filters);
        res.status(200).json({ success: true, data: movements });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getStockMovementsByProduct = async (req, res) => {
    try {
        const movements = await stockMovementService.getStockMovementsByProduct(req.params.productId);
        res.status(200).json({ success: true, data: movements });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const adjustStock = async (req, res) => {
    try {
        const movement = await stockMovementService.adjustStock(req.body, req.user.id);
        res.status(200).json({ success: true, data: movement });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const receiveStock = async (req, res) => {
    try {
        const finalShopId = req.shopId || req.body.shopId;
        const payload = { ...req.body, shopId: finalShopId };
        const movements = await stockMovementService.receiveStock(payload, req.user.id);
        res.status(200).json({ success: true, data: movements });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports = { getStockMovements, getStockMovementsByProduct, adjustStock, receiveStock };
