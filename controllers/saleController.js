const saleService = require("../services/saleService");

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
        const sales = await saleService.getAllSales();
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
        const daily = await saleService.getDailySales();
        res.status(200).json({ success: true, data: daily });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getMonthlySales = async (req, res) => {
    try {
        const monthly = await saleService.getMonthlySales();
        res.status(200).json({ success: true, data: monthly });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { createSale, getSales, getSaleById, getSalesByProduct, getDailySales, getMonthlySales };
