const categoryService = require("../services/categoryService");
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

const createCategory = async (req, res) => {
    try {
        const shopId = req.body.shopId || req.query.shopId || req.shopId;
        if (!shopId) return res.status(400).json({ success: false, message: "shopId is required" });
        const category = await categoryService.createCategory({ ...req.body, shopId });
        res.status(201).json({ success: true, data: category });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const getCategories = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const categories = await categoryService.getAllCategories(shopId);
        res.status(200).json({ success: true, data: categories });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getCategoryById = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const category = await categoryService.getCategoryById(req.params.id, shopId);
        res.status(200).json({ success: true, data: category });
    } catch (err) {
        res.status(404).json({ success: false, message: err.message });
    }
};

const updateCategory = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const category = await categoryService.updateCategory(req.params.id, req.body, shopId);
        res.status(200).json({ success: true, data: category });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        await categoryService.deleteCategory(req.params.id, shopId);
        res.status(200).json({ success: true, message: "Category deleted successfully" });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports = { createCategory, getCategories, getCategoryById, updateCategory, deleteCategory };
