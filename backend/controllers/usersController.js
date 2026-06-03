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
        const shopId = req.body.shopId;
        const authorized = await verifyShopOwnership(res, req.user.id, shopId);
        if (!authorized) return;

        const user = await userService.createUser(req.body);
        res.status(201).json({ success: true, data: user });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const user = await userService.updateUser(req.params.id, req.body);
        res.status(200).json({ success: true, data: user });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const shopId = req.query.shopId || req.body.shopId;
        await userService.deleteUser(req.params.id, shopId);
        res.status(200).json({ success: true, message: "Staff member removed successfully" });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser };
