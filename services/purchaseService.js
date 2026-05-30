const { prisma } = require("../db/db");

const createPurchase = async (purchaseData, userId) => {
    const { shopId, supplierName, items } = purchaseData;
    if (!items || items.length === 0) {
        throw new Error("Purchase items are required");
    }

    return await prisma.$transaction(async (tx) => {
        let totalAmount = 0;
        const itemsData = [];

        for (const item of items) {
            const subtotal = item.quantity * item.purchasePrice;
            totalAmount += subtotal;

            itemsData.push({
                productId: item.productId,
                quantity: parseFloat(item.quantity),
                purchasePrice: parseFloat(item.purchasePrice),
                subtotal: parseFloat(subtotal)
            });
        }

        // Create purchase record
        const purchase = await tx.purchase.create({
            data: {
                shopId,
                supplierName,
                totalAmount,
                createdBy: userId,
                items: { create: itemsData }
            },
            include: { items: true }
        });

        // Adjust stock and log stock movement
        for (const item of items) {
            const product = await tx.product.findUnique({ where: { id: item.productId } });
            if (product) {
                const newStock = product.currentStock + item.quantity;
                
                await tx.product.update({
                    where: { id: item.productId },
                    data: { currentStock: newStock }
                });

                await tx.stockMovement.create({
                    data: {
                        shopId,
                        productId: item.productId,
                        type: "addition",
                        quantity: parseFloat(item.quantity),
                        previousStock: product.currentStock,
                        newStock,
                        referenceType: "purchase",
                        referenceId: purchase.id,
                        note: `Stock updated via purchase from supplier ${supplierName || ""}`,
                        createdBy: userId
                    }
                });
            }
        }

        return purchase;
    });
};

const getAllPurchases = async () => {
    return await prisma.purchase.findMany({
        include: {
            items: { include: { product: { select: { id: true, name: true, skuCode: true } } } },
            creator: { select: { id: true, name: true } },
            shop: { select: { id: true, shopName: true } }
        }
    });
};

const getPurchaseById = async (id) => {
    const purchase = await prisma.purchase.findUnique({
        where: { id },
        include: {
            items: { include: { product: { select: { id: true, name: true, skuCode: true } } } },
            creator: { select: { id: true, name: true } },
            shop: { select: { id: true, shopName: true } }
        }
    });
    if (!purchase) {
        throw new Error("Purchase not found");
    }
    return purchase;
};

const getPurchasesByProduct = async (productId) => {
    return await prisma.purchaseItem.findMany({
        where: { productId },
        include: {
            purchase: {
                include: {
                    creator: { select: { id: true, name: true } },
                    shop: { select: { id: true, shopName: true } }
                }
            }
        }
    });
};

module.exports = { createPurchase, getAllPurchases, getPurchaseById, getPurchasesByProduct };
