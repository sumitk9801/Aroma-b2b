const { prisma } = require("../db/db");

/**
 * Create a new supplier profile for a shop.
 */
const createSupplier = async (data, shopId) => {
    const { name, phone, email, address, notes } = data;
    return await prisma.supplier.create({
        data: { shopId, name, phone, email, address, notes }
    });
};

/**
 * Get all suppliers for a shop with purchase totals.
 */
const getAllSuppliers = async (shopId) => {
    const suppliers = await prisma.supplier.findMany({
        where: { shopId },
        include: {
            _count: { select: { purchases: true } },
            purchases: { select: { totalAmount: true } }
        },
        orderBy: { createdAt: "desc" }
    });

    return suppliers.map(s => ({
        id: s.id,
        name: s.name,
        phone: s.phone,
        email: s.email,
        address: s.address,
        notes: s.notes,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        totalOrders: s._count.purchases,
        totalSpent: s.purchases.reduce((acc, p) => acc + p.totalAmount, 0)
    }));
};

/**
 * Get a single supplier with full purchase history.
 */
const getSupplierById = async (id, shopId) => {
    const supplier = await prisma.supplier.findFirst({
        where: { id, shopId },
        include: {
            purchases: {
                orderBy: { createdAt: "desc" },
                include: {
                    items: {
                        include: {
                            product: { select: { id: true, name: true, skuCode: true } }
                        }
                    },
                    creator: { select: { id: true, name: true } }
                }
            }
        }
    });
    if (!supplier) throw new Error("Supplier not found");

    const totalSpent = supplier.purchases.reduce((acc, p) => acc + p.totalAmount, 0);
    return { ...supplier, totalSpent, totalOrders: supplier.purchases.length };
};

/**
 * Update a supplier profile.
 */
const updateSupplier = async (id, shopId, data) => {
    const existing = await prisma.supplier.findFirst({ where: { id, shopId } });
    if (!existing) throw new Error("Supplier not found");
    return await prisma.supplier.update({
        where: { id },
        data: { name: data.name, phone: data.phone, email: data.email, address: data.address, notes: data.notes }
    });
};

/**
 * Delete a supplier profile (preserves purchase history).
 */
const deleteSupplier = async (id, shopId) => {
    const existing = await prisma.supplier.findFirst({ where: { id, shopId } });
    if (!existing) throw new Error("Supplier not found");
    await prisma.purchase.updateMany({ where: { supplierId: id }, data: { supplierId: null } });
    await prisma.supplier.delete({ where: { id } });
};

/**
 * Get supplier spend stats for a shop.
 */
const getSupplierStats = async (shopId) => {
    const suppliers = await getAllSuppliers(shopId);
    const sorted = [...suppliers].sort((a, b) => b.totalSpent - a.totalSpent);
    const totalSpent = suppliers.reduce((acc, s) => acc + s.totalSpent, 0);
    return { totalSuppliers: suppliers.length, totalSpent, topSuppliers: sorted.slice(0, 10) };
};

module.exports = { createSupplier, getAllSuppliers, getSupplierById, updateSupplier, deleteSupplier, getSupplierStats };
