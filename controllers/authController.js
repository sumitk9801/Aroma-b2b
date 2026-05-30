const authService = require("../services/authService");
const Logger = require("../utils/logger");

const register = async (req, res) => {
    try {
        const user = await authService.register(req.body);
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: user
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const login = async (req, res) => {
    try {
        const result = await authService.login(req.body);
        res.status(200).json({
            success: true,
            message: "User logged in successfully",
            data: result
        });
    } catch (err) {
        const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || req.ip;
        Logger.security(`Authentication failed: Login failure for email ${req.body?.email || "unknown"}. Reason: ${err.message}. IP: ${ip}`);
        res.status(400).json({ success: false, message: err.message });
    }
};


const logout = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        await authService.logout(token);
        res.status(200).json({
            success: true,
            message: "User logged out successfully"
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        const user = await authService.getProfile(req.user.id);
        res.status(200).json({
            success: true,
            message: "Current user profile retrieved",
            data: user
        });
    } catch (err) {
        res.status(404).json({ success: false, message: err.message });
    }
};

const refreshToken = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ success: false, message: "No token provided" });
        }
        res.status(200).json({
            success: true,
            message: "Token refreshed successfully",
            data: { token }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { register, login, logout, getCurrentUser, refreshToken };
