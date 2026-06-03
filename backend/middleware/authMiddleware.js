const jwt = require("jsonwebtoken");
const { prisma } = require("../db/db");
const Logger = require("../utils/logger");

const auth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || req.ip;
        if (!token) {
            Logger.security(`Authentication failed: Token missing. IP: ${ip}`);
            return res.status(401).json({ message: "No token provided" });
        }
        const isBlackListed = await prisma.blackList.findUnique({ where: { token } });
        if (isBlackListed) {
            Logger.security(`Authentication failed: Blacklisted token supplied. IP: ${ip}`);
            return res.status(401).json({ message: "Token is blacklisted" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
        req.user = decoded;
        next();
    } catch (err) {
        const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || req.ip;
        Logger.security(`Authentication failed: Invalid/Expired token context. IP: ${ip}`);
        res.status(401).json({ message: "Invalid token" });
    }
};

const normalizeRole = (role) => {
    if (!role) return "";
    const r = role.toUpperCase();
    if (r === "STAFF") return "INVENTORY_STAFF";
    return r;
};

const checkShopContext = async (req, res, next) => {
    try {
        const shopId = req.headers["x-shop-id"] || req.query.shopId || req.body.shopId;
        
        if (shopId) {
            const shop = await prisma.shop.findUnique({
                where: { id: shopId }
            });
            
            if (!shop) {
                return res.status(404).json({ success: false, message: "Shop not found" });
            }
            
            if (shop.ownerId === req.user.id) {
                req.user.shopRole = "ADMIN";
                req.shopId = shopId;
                return next();
            }
            
            const staff = await prisma.shopStaff.findUnique({
                where: {
                    shopId_userId: {
                        shopId,
                        userId: req.user.id
                    }
                }
            });
            
            if (!staff) {
                return res.status(403).json({ success: false, message: "Forbidden: You do not belong to this shop" });
            }
            
            req.user.shopRole = staff.role.toUpperCase();
            req.shopId = shopId;
        } else {
            req.user.shopRole = req.user.role ? req.user.role.toUpperCase() : "STAFF";
        }
        next();
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const allowRoles = (...allowedRoles) => {
    return (req, res, next) => {
        const userRole = normalizeRole(req.user?.shopRole || req.user?.role);
        const normalizedAllowed = allowedRoles.map(normalizeRole);
        
        if (!normalizedAllowed.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You do not have permission to access this resource"
            });
        }
        next();
    };
};

const authorize = (req,res,next)=>{
    if (req.user.role !== "admin" && req.user.role !== "manager") {
        return res.status(403).json({ message: "Forbidden: You don't have permission to access this resource" });
    }
    next();
};

module.exports = { auth, authorize, checkShopContext, allowRoles, normalizeRole };
