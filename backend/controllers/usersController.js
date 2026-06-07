const userService = require("../services/userService");
const { prisma } = require("../db/db");

/**
 * Verify that the requesting admin owns the given shopId.
 * Returns true if authorized, sends 403 response and returns false otherwise.
 */
const verifyShopOwnership = async (res, userId, shopId) => {
    if (!shopId) {
        res.status(400).json({ success: false, message: "shopId is required" });
        return false;
    }
    // Verify if the user is the owner of the shop
    const shop = await prisma.shop.findFirst({
        where: { id: shopId, ownerId: userId }
    });
    if (shop) return true;

    // Verify if the user is an admin or manager in the shop's staff list
    const staff = await prisma.shopStaff.findFirst({
        where: {
            shopId,
            userId,
            role: { in: ["admin", "manager"] }
        }
    });
    if (staff) return true;

    res.status(403).json({ success: false, message: "You do not have access to this shop" });
    return false;
};

const getUsers = async (req, res) => {
    try {
        const shopId = req.query.shopId;
        const authorized = await verifyShopOwnership(res, req.user.id, shopId);
        if (!authorized) return;

        const users = await userService.getAllUsers(shopId);
        res.status(200).json({ success: true, data: users });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await userService.getUserById(req.params.id);
        res.status(200).json({ success: true, data: user });
    } catch (err) {
        res.status(404).json({ success: false, message: err.message });
    }
};

const createUser = async (req, res) => {
    try {
        const shopId = req.body.shopId || req.shopId;
        if (!shopId) {
            return res.status(400).json({ success: false, message: "shopId is required context" });
        }
        const authorized = await verifyShopOwnership(res, req.user.id, shopId);
        if (!authorized) return;

        // Enforce role-based limits for Managers
        if (req.user.shopRole === "MANAGER") {
            if (req.body.role && req.body.role.toLowerCase() === "admin") {
                return res.status(403).json({ success: false, message: "Forbidden: Managers cannot create admin users" });
            }
        }

        const user = await userService.createUser({ ...req.body, shopId });
        res.status(201).json({ success: true, data: user });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const shopId = req.headers["x-shop-id"] || req.query.shopId || req.body.shopId || req.shopId;
        
        if (!shopId) {
            return res.status(400).json({ success: false, message: "shopId is required context" });
        }

        // Verify target user belongs to the shop
        const targetStaff = await prisma.shopStaff.findUnique({
            where: {
                shopId_userId: {
                    shopId,
                    userId: targetUserId
                }
            }
        });

        if (!targetStaff) {
            return res.status(404).json({ success: false, message: "Staff member not found in this shop" });
        }

        // Enforce role-based limits for Managers
        if (req.user.shopRole === "MANAGER") {
            if (targetStaff.role.toLowerCase() === "admin") {
                return res.status(403).json({ success: false, message: "Forbidden: Managers cannot modify admin accounts" });
            }
            if (req.body.role && req.body.role.toLowerCase() === "admin") {
                return res.status(403).json({ success: false, message: "Forbidden: Managers cannot assign the admin role" });
            }
        }

        const user = await userService.updateUser(targetUserId, req.body);

        // Sync role to ShopStaff table if role was updated
        if (req.body.role) {
            await prisma.shopStaff.update({
                where: {
                    shopId_userId: {
                        shopId,
                        userId: targetUserId
                    }
                },
                data: {
                    role: req.body.role.toLowerCase()
                }
            });
        }

        res.status(200).json({ 
            success: true, 
            data: { 
                ...user, 
                shopRole: req.body.role ? req.body.role.toLowerCase() : targetStaff.role 
            } 
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const shopId = req.query.shopId || req.body.shopId || req.shopId;
        const targetUserId = req.params.id;

        if (!shopId) {
            return res.status(400).json({ success: false, message: "shopId is required context" });
        }

        // Verify target user belongs to the shop
        const targetStaff = await prisma.shopStaff.findUnique({
            where: {
                shopId_userId: {
                    shopId,
                    userId: targetUserId
                }
            }
        });

        if (!targetStaff) {
            return res.status(404).json({ success: false, message: "Staff member not found in this shop" });
        }

        // Enforce role-based limits for Managers
        if (req.user.shopRole === "MANAGER") {
            if (targetStaff.role.toLowerCase() === "admin") {
                return res.status(403).json({ success: false, message: "Forbidden: Managers cannot remove admin staff" });
            }
        }

        await userService.deleteUser(targetUserId, shopId);
        res.status(200).json({ success: true, message: "Staff member removed successfully" });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser };
