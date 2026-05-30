const { prisma } = require("../db/db");

const createShop = async (shopData, ownerId) => {
    const { shopName, businessType, address, phone } = shopData;
    return await prisma.shop.create({
        data: { shopName, businessType, address, phone, ownerId }
    });
};

const getAllShops = async () => {
    return await prisma.shop.findMany({
        include: { owner: { select: { id: true, name: true, email: true } } }
    });
};

const getShopById = async (id) => {
    const shop = await prisma.shop.findUnique({
        where: { id },
        include: { owner: { select: { id: true, name: true, email: true } } }
    });
    if (!shop) {
        throw new Error("Shop not found");
    }
    return shop;
};

const updateShop = async (id, shopData) => {
    const { shopName, businessType, address, phone } = shopData;
    return await prisma.shop.update({
        where: { id },
        data: { shopName, businessType, address, phone }
    });
};

module.exports = { createShop, getAllShops, getShopById, updateShop };
