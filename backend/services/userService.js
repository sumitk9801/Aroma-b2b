const { prisma } = require("../db/db");
const bcrypt = require("bcrypt");

const getAllUsers = async () => {
    return await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true }
    });
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

const createUser = async (userData) => {
    const { name, email, password, role } = userData;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        throw new Error("Email already in use");
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    return await prisma.user.create({
        data: { name, email, password: hashedPassword, role: role || "customer" },
        select: { id: true, name: true, email: true, role: true, isActive: true }
    });
};

const updateUser = async (id, updateData) => {
    const { name, email, role, isActive } = updateData;
    return await prisma.user.update({
        where: { id },
        data: { name, email, role, isActive },
        select: { id: true, name: true, email: true, role: true, isActive: true }
    });
};

const deleteUser = async (id) => {
    return await prisma.user.delete({ where: { id } });
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser };
