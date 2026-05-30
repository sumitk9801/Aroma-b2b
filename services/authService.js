const { prisma } = require("../db/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const register = async (userData) => {
    const { name, email, password, role } = userData;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new Error("User already exists");
    }   
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: role || "customer"
        },
        select: { id: true, name: true, email: true, role: true, isActive: true }
    });
    return user;
};

const login = async (loginData) => {
    const { email, password } = loginData;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new Error("Invalid email or password");
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error("Invalid email or password");
    }
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || "fallback_secret", { expiresIn: "1h" });
    return {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
    };
};

const logout = async (token) => {
    if (!token) {
        throw new Error("No token provided");
    }
    await prisma.blackList.create({
        data: {
            token,
            expireAt: new Date(Date.now() + 5 * 60 * 60 * 1000)
        }
    });
    return true;
};

const getProfile = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true }
    });
    if (!user) {
        throw new Error("User not found");
    }
    return user;
};

module.exports = { register, login, logout, getProfile };
