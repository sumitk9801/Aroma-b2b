const productService = require("../services/productService");
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

const createProduct = async (req, res) => {
    try {
        const shopId = req.body.shopId || req.query.shopId || req.shopId;
        if (!shopId) return res.status(400).json({ success: false, message: "shopId is required" });
        const product = await productService.createProduct({ ...req.body, shopId });
        res.status(201).json({ success: true, data: product });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const getProducts = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const products = await productService.getAllProducts(shopId);
        res.status(200).json({ success: true, data: products });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getProductById = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const product = await productService.getProductById(req.params.id, shopId);
        res.status(200).json({ success: true, data: product });
    } catch (err) {
        res.status(404).json({ success: false, message: err.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const product = await productService.updateProduct(req.params.id, req.body, shopId);
        res.status(200).json({ success: true, data: product });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        await productService.deleteProduct(req.params.id, shopId);
        res.status(200).json({ success: true, message: "Product deleted successfully" });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const getLowStockProducts = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const products = await productService.getLowStockProducts(shopId);
        res.status(200).json({ success: true, data: products });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const searchProducts = async (req, res) => {
    try {
        const { q } = req.query;
        const shopId = await resolveShopContext(req);
        const products = await productService.searchProducts(q, shopId);
        res.status(200).json({ success: true, data: products });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const filterProducts = async (req, res) => {
    try {
        const shopId = await resolveShopContext(req);
        const filters = { ...req.query };
        if (shopId) {
            filters.shopId = shopId;
        }
        const products = await productService.filterProducts(filters);
        res.status(200).json({ success: true, data: products });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { 
    createProduct, 
    getProducts, 
    getProductById, 
    updateProduct, 
    deleteProduct, 
    getLowStockProducts,
    searchProducts,
    filterProducts
};

