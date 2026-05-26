const jwt = require("jsonwebtoken");
const BlackList = require("../models/blackListModel");

const auth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }
        const isBlackListed = await BlackList.findOne({ token });
        if (isBlackListed) {
            return res.status(401).json({ message: "Token is blacklisted" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
};
const authorize = (roles) => {
    return (req, res, next) => {
        if ("customer"== req.user.role) {
            return res.status(403).json({ message: "Forbidden: You don't have permission to access this resource" });
        }
        next();
    };
};

module.exports = auth;