const { prisma } = require("../db/db");

const createCategory = async (categoryData) => {
    const { shopId, name, image } = categoryData;
    return await prisma.category.create({
        data: { shopId, name, image }
    });
};

const getAllCategories = async () => {
    return await prisma.category.findMany({
        include: { shop: { select: { id: true, shopName: true } } }
    });
};

const getCategoryById = async (id) => {
    const category = await prisma.category.findUnique({
        where: { id },
        include: { shop: { select: { id: true, shopName: true } } }
    });
    if (!category) {
        throw new Error("Category not found");
    }
    return category;
};

const updateCategory = async (id, updateData) => {
    const { name, image } = updateData;
    return await prisma.category.update({
        where: { id },
        data: { name, image }
    });
};

const deleteCategory = async (id) => {
    return await prisma.category.delete({ where: { id } });
};

module.exports = { createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory };
