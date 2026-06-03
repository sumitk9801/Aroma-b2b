const { prisma } = require("../db/db");

const getAllStockMovements = async () => {
    return await prisma.stockMovement.findMany({
        include: {
            product: { select: { id: true, name: true, skuCode: true } },
            shop: { select: { id: true, shopName: true } },
            creator: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: "desc" }
    });
};

const getStockMovementsByProduct = async (productId) => {
    return await prisma.stockMovement.findMany({
        where: { productId },
        include: {
            shop: { select: { id: true, shopName: true } },
            creator: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: "desc" }
    });
};

const adjustStock = async (adjustmentData, userId) => {
    const { shopId, productId, type, quantity, reason, referenceType, referenceId } = adjustmentData;
    if (!["addition", "reduction"].includes(type)) {
        throw new Error("Type must be 'addition' or 'reduction'");
    }
    if (quantity <= 0) {
        throw new Error("Quantity must be positive");
    }

    return await prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) {
            throw new Error("Product not found");
        }

        const change = parseFloat(quantity);
        let newStock = product.currentStock;

        if (type === "addition") {
            newStock += change;
        } else {
            if (product.currentStock < change) {
                throw new Error(`Insufficient stock for reduction. Available: ${product.currentStock}`);
            }
            newStock -= change;
        }

        // Update product stock
        await tx.product.update({
            where: { id: productId },
            data: { currentStock: newStock }
        });

        const finalShopId = shopId || product.shopId;

        // Create movement record
        const movement = await tx.stockMovement.create({
            data: {
                shopId: finalShopId,
                productId,
                type,
                quantity: change,
                previousStock: product.currentStock,
                newStock,
                note: reason,
                referenceType,
                referenceId,
                createdBy: userId
            }
        });

        return movement;
    });
};

const receiveStock = async (receiveData, userId) => {
    const { shopId, supplierName, deliveryNote, items, note } = receiveData;
    if (!items || items.length === 0) {
        throw new Error("Items are required");
    }

    return await prisma.$transaction(async (tx) => {
        const movements = [];

        for (const item of items) {
            const product = await tx.product.findUnique({ where: { id: item.productId } });
            if (!product) {
                throw new Error(`Product not found: ${item.productId}`);
            }

            const change = parseFloat(item.quantity);
            const newStock = product.currentStock + change;

            // Update product stock
            await tx.product.update({
                where: { id: item.productId },
                data: { currentStock: newStock }
            });

            const finalShopId = shopId || product.shopId;

            // Generate detailed note
            let detailedNote = `Received ${change} units of ${product.name} from supplier: ${supplierName || "N/A"}`;
            if (note) {
                detailedNote += `. Note: ${note}`;
            }

            // Create movement record
            const movement = await tx.stockMovement.create({
                data: {
                    shopId: finalShopId,
                    productId: item.productId,
                    type: "addition",
                    quantity: change,
                    previousStock: product.currentStock,
                    newStock,
                    referenceType: "receiving",
                    referenceId: deliveryNote || null,
                    note: detailedNote,
                    createdBy: userId
                },
                include: {
                    product: { select: { id: true, name: true, skuCode: true } },
                    creator: { select: { id: true, name: true } }
                }
            });

            movements.push(movement);
        }

        return movements;
    });
};

module.exports = { getAllStockMovements, getStockMovementsByProduct, adjustStock, receiveStock };
