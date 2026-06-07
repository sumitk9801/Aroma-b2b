const { prisma } = require("../db/db");

const mapCategory = (category) => {
    if (!category) return null;
    return {
        ...category,
        imageUrl: category.image
    };
};

const createCategory = async (categoryData) => {
    const { shopId, name, image, imageUrl } = categoryData;
    const finalImage = image || imageUrl;
    const category = await prisma.category.create({
        data: { shopId, name, image: finalImage }
    });
    return mapCategory(category);
};

const getAllCategories = async (shopId) => {
    const where = {};
    if (shopId) {
        where.shopId = shopId;
    }
    const categories = await prisma.category.findMany({
        where,
        include: { shop: { select: { id: true, shopName: true } } }
    });
    return categories.map(mapCategory);
};

const getCategoryById = async (id, shopId) => {
    const category = await prisma.category.findUnique({
        where: { id },
        include: { shop: { select: { id: true, shopName: true } } }
    });
    if (!category || (shopId && category.shopId !== shopId)) {
        throw new Error("Category not found");
    }
    return mapCategory(category);
};

const updateCategory = async (id, updateData, shopId) => {
    const categoryExists = await prisma.category.findUnique({ where: { id } });
    if (!categoryExists || (shopId && categoryExists.shopId !== shopId)) {
        throw new Error("Category not found");
    }
    const { name, image, imageUrl } = updateData;
    const finalImage = image || imageUrl;
    const category = await prisma.category.update({
        where: { id },
        data: { name, image: finalImage }
    });
    return mapCategory(category);
};

const deleteCategory = async (id, shopId) => {
    const categoryExists = await prisma.category.findUnique({ where: { id } });
    if (!categoryExists || (shopId && categoryExists.shopId !== shopId)) {
        throw new Error("Category not found");
    }
    return await prisma.category.delete({ where: { id } });
};

module.exports = { createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory };
