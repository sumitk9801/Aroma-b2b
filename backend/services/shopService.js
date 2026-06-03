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

        const staffId = "STF-" + Math.random().toString(36).substring(2, 8).toUpperCase();

        // Auto-add the owner as an admin staff member of their own shop
        await tx.shopStaff.upsert({
            where: { shopId_userId: { shopId: newShop.id, userId: ownerId } },
            create: { shopId: newShop.id, userId: ownerId, role: "admin", staffId },
            update: {}
        });

        return newShop;
    });

    return mapShop(shop);
};

const getAllShops = async (userId) => {
    const shops = await prisma.shop.findMany({
        where: userId ? {
            OR: [
                { ownerId: userId },
                { staff: { some: { userId } } }
            ]
        } : undefined,
        include: {
            owner: { select: { id: true, name: true, email: true } },
            staff: userId ? {
                where: { userId }
            } : undefined
        }
    });
    return shops.map(shop => {
        const staffEntry = shop.staff?.find(s => s.userId === userId);
        const mapped = mapShop(shop);
        return {
            ...mapped,
            role: staffEntry ? staffEntry.role : (shop.ownerId === userId ? "admin" : "staff")
        };
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
