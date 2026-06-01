const { prisma } = require("../db/db");

const mapShop = (shop) => {
    if (!shop) return null;
    return {
        ...shop,
        name: shop.shopName
    };
};

const createShop = async (shopData, ownerId) => {
    const { shopName, name, businessType, address, phone } = shopData;
    const finalShopName = shopName || name;

    // Use a transaction to create the shop and register the owner as admin staff
    const shop = await prisma.$transaction(async (tx) => {
        const newShop = await tx.shop.create({
            data: { shopName: finalShopName, businessType, address, phone, ownerId }
        });

        // Auto-add the owner as an admin staff member of their own shop
        await tx.shopStaff.upsert({
            where: { shopId_userId: { shopId: newShop.id, userId: ownerId } },
            create: { shopId: newShop.id, userId: ownerId, role: "admin" },
            update: {}
        });

        return newShop;
    });

    return mapShop(shop);
};

const getAllShops = async (ownerId) => {
    const shops = await prisma.shop.findMany({
        where: ownerId ? { ownerId } : undefined,
        include: { owner: { select: { id: true, name: true, email: true } } }
    });
    return shops.map(mapShop);
};

const getShopById = async (id) => {
    const shop = await prisma.shop.findUnique({
        where: { id },
        include: { owner: { select: { id: true, name: true, email: true } } }
    });
    if (!shop) {
        throw new Error("Shop not found");
    }
    return mapShop(shop);
};

const updateShop = async (id, shopData) => {
    const { shopName, name, businessType, address, phone } = shopData;
    const finalShopName = shopName || name;
    const shop = await prisma.shop.update({
        where: { id },
        data: { shopName: finalShopName, businessType, address, phone }
    });
    return mapShop(shop);
};

module.exports = { createShop, getAllShops, getShopById, updateShop };
