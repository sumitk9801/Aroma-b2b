const { prisma } = require("../db/db");

const createSale = async (saleData, userId) => {
    const { shopId, customerName, paymentMethod, items } = saleData;
    if (!items || items.length === 0) {
        throw new Error("Sale items are required");
    }

    return await prisma.$transaction(async (tx) => {
        let totalAmount = 0;
        const itemsData = [];

        // Verify stock first
        for (const item of items) {
            const product = await tx.product.findUnique({ where: { id: item.productId } });
            if (!product) {
                throw new Error(`Product not found: ${item.productId}`);
            }
            if (product.currentStock < item.quantity) {
                throw new Error(`Insufficient stock for product ${product.name}. Available: ${product.currentStock}`);
            }

            const subtotal = item.quantity * item.sellingPrice;
            totalAmount += subtotal;

            itemsData.push({
                productId: item.productId,
                quantity: parseFloat(item.quantity),
                sellingPrice: parseFloat(item.sellingPrice),
                subtotal: parseFloat(subtotal)
            });
        }

        // Create sale record
        const sale = await tx.sale.create({
            data: {
                shopId,
                customerName,
                totalAmount,
                paymentMethod: paymentMethod || "cash",
                createdBy: userId,
                items: { create: itemsData }
            },
            include: { items: true }
        });

        // Deduct stock and log stock movement
        for (const item of items) {
            const product = await tx.product.findUnique({ where: { id: item.productId } });
            const newStock = product.currentStock - item.quantity;
            
            await tx.product.update({
                where: { id: item.productId },
                data: { currentStock: newStock }
            });

            await tx.stockMovement.create({
                data: {
                    shopId,
                    productId: item.productId,
                    type: "reduction",
                    quantity: parseFloat(item.quantity),
                    previousStock: product.currentStock,
                    newStock,
                    referenceType: "sale",
                    referenceId: sale.id,
                    note: `Stock updated via checkout transaction`,
                    createdBy: userId
                }
            });
        }

        return sale;
    });
};

const getAllSales = async () => {
    return await prisma.sale.findMany({
        include: {
            items: { include: { product: { select: { id: true, name: true, skuCode: true } } } },
            creator: { select: { id: true, name: true } },
            shop: { select: { id: true, shopName: true } }
        }
    });
};

const getSaleById = async (id) => {
    const sale = await prisma.sale.findUnique({
        where: { id },
        include: {
            items: { include: { product: { select: { id: true, name: true, skuCode: true } } } },
            creator: { select: { id: true, name: true } },
            shop: { select: { id: true, shopName: true } }
        }
    });
    if (!sale) {
        throw new Error("Sale not found");
    }
    return sale;
};

const getSalesByProduct = async (productId) => {
    return await prisma.saleItem.findMany({
        where: { productId },
        include: {
            sale: {
                include: {
                    creator: { select: { id: true, name: true } },
                    shop: { select: { id: true, shopName: true } }
                }
            }
        }
    });
};

const getDailySales = async () => {
    const sales = await prisma.sale.findMany();
    const daily = {};
    for (const s of sales) {
        const dateStr = s.createdAt.toISOString().split("T")[0];
        daily[dateStr] = (daily[dateStr] || 0) + s.totalAmount;
    }
    return daily;
};

const getMonthlySales = async () => {
    const sales = await prisma.sale.findMany();
    const monthly = {};
    for (const s of sales) {
        const monthStr = s.createdAt.toISOString().substring(0, 7);
        monthly[monthStr] = (monthly[monthStr] || 0) + s.totalAmount;
    }
    return monthly;
};

module.exports = { createSale, getAllSales, getSaleById, getSalesByProduct, getDailySales, getMonthlySales };
