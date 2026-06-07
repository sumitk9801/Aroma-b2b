const { prisma } = require("../db/db");

/**
 * Create a new customer profile for a shop.
 */
const createCustomer = async (data, shopId) => {
    const { name, phone, email, address, notes } = data;
    return await prisma.customer.create({
        data: { shopId, name, phone, email, address, notes }
    });
};

/**
 * Get all customers for a shop with their sales count and total spend.
 */
const getAllCustomers = async (shopId) => {
    const customers = await prisma.customer.findMany({
        where: { shopId },
        include: {
            _count: { select: { sales: true } },
            sales: {
                select: { totalAmount: true }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    return customers.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        address: c.address,
        notes: c.notes,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        totalPurchases: c._count.sales,
        totalSpent: c.sales.reduce((acc, s) => acc + s.totalAmount, 0)
    }));
};

/**
 * Get a single customer with full purchase history.
 */
const getCustomerById = async (id, shopId) => {
    const customer = await prisma.customer.findFirst({
        where: { id, shopId },
        include: {
            sales: {
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
    if (!customer) throw new Error("Customer not found");

    const totalSpent = customer.sales.reduce((acc, s) => acc + s.totalAmount, 0);
    return { ...customer, totalSpent, totalPurchases: customer.sales.length };
};

/**
 * Update a customer profile.
 */
const updateCustomer = async (id, shopId, data) => {
    const existing = await prisma.customer.findFirst({ where: { id, shopId } });
    if (!existing) throw new Error("Customer not found");
    return await prisma.customer.update({
        where: { id },
        data: { name: data.name, phone: data.phone, email: data.email, address: data.address, notes: data.notes }
    });
};

/**
 * Delete a customer profile (does not delete their sales — history is preserved).
 */
const deleteCustomer = async (id, shopId) => {
    const existing = await prisma.customer.findFirst({ where: { id, shopId } });
    if (!existing) throw new Error("Customer not found");
    // Unlink from sales first to preserve sale history
    await prisma.sale.updateMany({ where: { customerId: id }, data: { customerId: null } });
    await prisma.customer.delete({ where: { id } });
};

/**
 * Get customer stats — new customers over time, top spenders.
 */
const getCustomerStats = async (shopId, startDate, endDate) => {
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const [total, newInRange, topSpenders] = await Promise.all([
        prisma.customer.count({ where: { shopId } }),
        prisma.customer.count({ where: { shopId, createdAt: { gte: start, lte: end } } }),
        getAllCustomers(shopId)
    ]);

    // Sort top spenders
    const sorted = [...topSpenders].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10);

    return { totalCustomers: total, newCustomersInRange: newInRange, topSpenders: sorted };
};

module.exports = { createCustomer, getAllCustomers, getCustomerById, updateCustomer, deleteCustomer, getCustomerStats };
