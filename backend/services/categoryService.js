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

const getAllCategories = async () => {
    const categories = await prisma.category.findMany({
        include: { shop: { select: { id: true, shopName: true } } }
    });
    return categories.map(mapCategory);
};

const getCategoryById = async (id) => {
    const category = await prisma.category.findUnique({
        where: { id },
        include: { shop: { select: { id: true, shopName: true } } }
    });
    if (!category) {
        throw new Error("Category not found");
    }
    return mapCategory(category);
};

const updateCategory = async (id, updateData) => {
    const { name, image, imageUrl } = updateData;
    const finalImage = image || imageUrl;
    const category = await prisma.category.update({
        where: { id },
        data: { name, image: finalImage }
    });
    return mapCategory(category);
};

const deleteCategory = async (id) => {
    return await prisma.category.delete({ where: { id } });
};

module.exports = { createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory };
