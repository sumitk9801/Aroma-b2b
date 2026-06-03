const { prisma } = require("../db/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const register = async (userData) => {
    const { name, email, password } = userData;
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
            role: "admin"
        },
        select: { id: true, name: true, email: true, role: true, isActive: true }
    });
    return user;
};

const login = async (loginData) => {
    const { email, password, shopIdentifier } = loginData;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new Error("Invalid email or password");
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error("Invalid email or password");
    }

    let assignedShop = null;

    // Verify shop assignment and Shop Name/ID for non-admin staff users
    if (user.role !== "admin") {
        if (!shopIdentifier) {
            throw new Error("Shop Name or Shop ID is required for staff members");
        }
        
        // Find all staff assignments for this user
        const staffAssignments = await prisma.shopStaff.findMany({
            where: { userId: user.id },
            include: { shop: true }
        });
        
        // Find a matching assignment where the shop ID matches, or the shop name matches case-insensitively, or the numeric shop code matches
        const cleanIdentifier = shopIdentifier.trim().toLowerCase();
        const matchedAssignment = staffAssignments.find(sa => {
            const shopIdMatch = sa.shopId.toLowerCase() === cleanIdentifier;
            const shopNameMatch = sa.shop.shopName.toLowerCase() === cleanIdentifier;
            const shopCodeMatch = String(sa.shop.shopCode) === cleanIdentifier;
            return shopIdMatch || shopNameMatch || shopCodeMatch;
        });
        
        if (!matchedAssignment) {
            throw new Error("You are not registered as a staff member of the specified shop Name or ID");
        }

        assignedShop = {
            id: matchedAssignment.shopId,
            shopCode: matchedAssignment.shop.shopCode,
            name: matchedAssignment.shop.shopName || matchedAssignment.shop.name,
            role: matchedAssignment.role
        };
    }
    
    // Access token (3 days)
    const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET || "fallback_secret",
        { expiresIn: "3d" }
    );
    
    // Refresh token (30 days)
    const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "fallback_refresh_secret",
        { expiresIn: "30d" }
    );
    
    // Store refresh token in DB
    await prisma.refreshToken.create({
        data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
    });

    return {
        token,
        refreshToken,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        assignedShop
    };
};

const logout = async (token, refreshToken) => {
    if (token) {
        await prisma.blackList.create({
            data: {
                token,
                expireAt: new Date(Date.now() + 5 * 60 * 60 * 1000)
            }
        }).catch(() => {}); // ignore duplicates
    }
    
    if (refreshToken) {
        await prisma.refreshToken.deleteMany({
            where: { token: refreshToken }
        }).catch(() => {});
    }
    
    return true;
};

const refreshSession = async (tokenVal) => {
    if (!tokenVal) {
        throw new Error("No refresh token provided");
    }
    
    let decoded;
    try {
        decoded = jwt.verify(
            tokenVal,
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "fallback_refresh_secret"
        );
    } catch (err) {
        // Delete expired token if it exists in DB
        await prisma.refreshToken.deleteMany({ where: { token: tokenVal } }).catch(() => {});
        throw new Error("Invalid or expired refresh token");
    }
    
    const dbToken = await prisma.refreshToken.findUnique({
        where: { token: tokenVal },
        include: { user: true }
    });
    
    if (!dbToken || dbToken.expiresAt < new Date()) {
        if (dbToken) {
            await prisma.refreshToken.delete({ where: { id: dbToken.id } }).catch(() => {});
        }
        throw new Error("Refresh token expired or revoked");
    }
    
    const user = dbToken.user;
    
    // Generate new access token (3 days)
    const newAccessToken = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET || "fallback_secret",
        { expiresIn: "3d" }
    );
    
    // Rotate refresh token (Generate new one)
    const newRefreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "fallback_refresh_secret",
        { expiresIn: "30d" }
    );
    
    // Delete old refresh token, save new one
    await prisma.$transaction([
        prisma.refreshToken.delete({ where: { id: dbToken.id } }),
        prisma.refreshToken.create({
            data: {
                token: newRefreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        })
    ]);
    
    return {
        token: newAccessToken,
        refreshToken: newRefreshToken,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
    };
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

module.exports = { register, login, logout, refreshSession, getProfile };
