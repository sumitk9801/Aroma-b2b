const supplierService = require("../services/supplierService");
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

const getAllSuppliers = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const data = await supplierService.getAllSuppliers(shopId);
        res.status(200).json({ success: true, message: "Suppliers retrieved", data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getSupplierById = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const data = await supplierService.getSupplierById(req.params.id, shopId);
        res.status(200).json({ success: true, message: "Supplier retrieved", data });
    } catch (err) {
        const code = err.message === "Supplier not found" ? 404 : 500;
        res.status(code).json({ success: false, message: err.message });
    }
};

const createSupplier = async (req, res) => {
    try {
        const shopId = req.body.shopId || req.query.shopId || req.shopId;
        if (!shopId) return res.status(400).json({ success: false, message: "shopId is required" });
        const data = await supplierService.createSupplier(req.body, shopId);
        res.status(201).json({ success: true, message: "Supplier created", data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const updateSupplier = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const data = await supplierService.updateSupplier(req.params.id, shopId, req.body);
        res.status(200).json({ success: true, message: "Supplier updated", data });
    } catch (err) {
        const code = err.message === "Supplier not found" ? 404 : 500;
        res.status(code).json({ success: false, message: err.message });
    }
};

const deleteSupplier = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        await supplierService.deleteSupplier(req.params.id, shopId);
        res.status(200).json({ success: true, message: "Supplier deleted" });
    } catch (err) {
        const code = err.message === "Supplier not found" ? 404 : 500;
        res.status(code).json({ success: false, message: err.message });
    }
};

const getSupplierStats = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const data = await supplierService.getSupplierStats(shopId);
        res.status(200).json({ success: true, message: "Supplier stats retrieved", data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getAllSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier, getSupplierStats };
