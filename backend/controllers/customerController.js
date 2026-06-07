const customerService = require("../services/customerService");
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

const getAllCustomers = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const data = await customerService.getAllCustomers(shopId);
        res.status(200).json({ success: true, message: "Customers retrieved", data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getCustomerById = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const data = await customerService.getCustomerById(req.params.id, shopId);
        res.status(200).json({ success: true, message: "Customer retrieved", data });
    } catch (err) {
        const code = err.message === "Customer not found" ? 404 : 500;
        res.status(code).json({ success: false, message: err.message });
    }
};

const createCustomer = async (req, res) => {
    try {
        const shopId = req.body.shopId || req.query.shopId || req.shopId;
        if (!shopId) return res.status(400).json({ success: false, message: "shopId is required" });
        const data = await customerService.createCustomer(req.body, shopId);
        res.status(201).json({ success: true, message: "Customer created", data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const updateCustomer = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const data = await customerService.updateCustomer(req.params.id, shopId, req.body);
        res.status(200).json({ success: true, message: "Customer updated", data });
    } catch (err) {
        const code = err.message === "Customer not found" ? 404 : 500;
        res.status(code).json({ success: false, message: err.message });
    }
};

const deleteCustomer = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        await customerService.deleteCustomer(req.params.id, shopId);
        res.status(200).json({ success: true, message: "Customer deleted" });
    } catch (err) {
        const code = err.message === "Customer not found" ? 404 : 500;
        res.status(code).json({ success: false, message: err.message });
    }
};

const getCustomerStats = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const { startDate, endDate } = req.query;
        const data = await customerService.getCustomerStats(shopId, startDate, endDate);
        res.status(200).json({ success: true, message: "Customer stats retrieved", data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getAllCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer, getCustomerStats };
