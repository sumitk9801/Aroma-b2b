const { prisma } = require("../db/db");
const bcrypt = require("bcrypt");

/**
 * Get all staff members for a specific shop.
 * The shop owner is always included (auto-backfilled if missing).
 */
const getAllUsers = async (shopId) => {
    if (!shopId) {
        throw new Error("shopId is required to fetch users");
    }

    // Get the shop to find the owner
    const shop = await prisma.shop.findUnique({
        where: { id: shopId },
        select: { ownerId: true }
    });

    if (!shop) {
        throw new Error("Shop not found");
    }

    // Ensure owner always has a ShopStaff entry (backfill for pre-existing shops)
    await prisma.shopStaff.upsert({
        where: { shopId_userId: { shopId, userId: shop.ownerId } },
        create: { shopId, userId: shop.ownerId, role: "admin" },
        update: {}
    });

    // Fetch all ShopStaff entries for this shop, including user details
    const staffEntries = await prisma.shopStaff.findMany({
        where: { shopId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    isActive: true,
                    createdAt: true
                }
            }
        },
        orderBy: { createdAt: "asc" }
    });

    return staffEntries.map((entry) => ({
        ...entry.user,
        shopRole: entry.role,
        shopStaffId: entry.id,
        isOwner: entry.user.id === shop.ownerId
    }));
};


const getUserById = async (id) => {
    const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true }
    });
    if (!user) {
        throw new Error("User not found");
    }
    return user;
};

/**
 * Create a new staff user and link them to a specific shop.
 */
const createUser = async (userData) => {
    const { name, email, password, role, shopId } = userData;

    if (!shopId) {
        throw new Error("shopId is required when creating a staff member");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        // If user already exists, just add them to this shop if not already a member
        const alreadyInShop = await prisma.shopStaff.findUnique({
            where: { shopId_userId: { shopId, userId: existing.id } }
        });
        if (alreadyInShop) {
            throw new Error("This user is already a staff member of this shop");
        }
        await prisma.shopStaff.create({
            data: { shopId, userId: existing.id, role: role || "staff" }
        });
        return { ...existing, shopRole: role || "staff" };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Use a transaction to create the user and their shop staff entry atomically
    const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || "staff"
            },
            select: { id: true, name: true, email: true, role: true, isActive: true }
        });

        const staffEntry = await tx.shopStaff.create({
            data: { shopId, userId: user.id, role: role || "staff" }
        });

        return { ...user, shopRole: staffEntry.role };
    });

    return result;
};

const updateUser = async (id, updateData) => {
    const { name, email, role, isActive, password } = updateData;
    const dataToUpdate = { name, email, role, isActive };

    if (password) {
        dataToUpdate.password = await bcrypt.hash(password, 12);
    }

    return await prisma.user.update({
        where: { id },
        data: dataToUpdate,
        select: { id: true, name: true, email: true, role: true, isActive: true }
    });
};

/**
 * Remove a staff member from a shop.
 * If the user belongs to no other shop, delete the user entirely.
 */
const deleteUser = async (id, shopId) => {
    if (shopId) {
        // Remove from this specific shop
        await prisma.shopStaff.deleteMany({
            where: { userId: id, shopId }
        });

        // Check if user is in any other shop
        const remainingShops = await prisma.shopStaff.count({ where: { userId: id } });
        // Also check if user is an owner of any shop
        const ownedShops = await prisma.shop.count({ where: { ownerId: id } });

        if (remainingShops === 0 && ownedShops === 0) {
            // User has no affiliations — delete them
            await prisma.user.delete({ where: { id } });
        }
    } else {
        // Fallback: hard delete (admin-level)
        await prisma.user.delete({ where: { id } });
    }
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser };
