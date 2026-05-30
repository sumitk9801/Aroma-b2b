const categoryService = require("../services/categoryService");

const createCategory = async (req, res) => {
    try {
        const category = await categoryService.createCategory(req.body);
        res.status(201).json({ success: true, data: category });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const getCategories = async (req, res) => {
    try {
        const categories = await categoryService.getAllCategories();
        res.status(200).json({ success: true, data: categories });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getCategoryById = async (req, res) => {
    try {
        const category = await categoryService.getCategoryById(req.params.id);
        res.status(200).json({ success: true, data: category });
    } catch (err) {
        res.status(404).json({ success: false, message: err.message });
    }
};

const updateCategory = async (req, res) => {
    try {
        const category = await categoryService.updateCategory(req.params.id, req.body);
        res.status(200).json({ success: true, data: category });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const deleteCategory = async (req, res) => {
    try {
        await categoryService.deleteCategory(req.params.id);
        res.status(200).json({ success: true, message: "Category deleted successfully" });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports = { createCategory, getCategories, getCategoryById, updateCategory, deleteCategory };
