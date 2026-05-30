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

const authorize = (req,res,next)=>{
    if(req.user.role!="admin"){
        return res.status(403).json({ message: "Forbidden: You don't have permission to access this resource" });
    }
    next();
};
module.exports = { auth, authorize };
