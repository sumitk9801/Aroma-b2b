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

const setRefreshTokenCookie = (res, token) => {
    res.cookie('refreshToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
};

const login = async (req, res) => {
    try {
        const result = await authService.login(req.body);
        const { token, refreshToken, user } = result;
        
        // Set HTTP-only cookie
        setRefreshTokenCookie(res, refreshToken);
        
        res.status(200).json({
            success: true,
            message: "User logged in successfully",
            data: { token, user }
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
        const refreshToken = req.cookies?.refreshToken;
        
        await authService.logout(token, refreshToken);
        
        // Clear HTTP-only cookie
        res.clearCookie('refreshToken', {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production'
        });
        
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
        const tokenVal = req.cookies?.refreshToken;
        if (!tokenVal) {
            return res.status(400).json({ success: false, message: "No refresh token provided" });
        }
        const result = await authService.refreshSession(tokenVal);
        const { token, refreshToken: newRefreshToken, user } = result;
        
        // Set new HTTP-only cookie
        setRefreshTokenCookie(res, newRefreshToken);
        
        res.status(200).json({
            success: true,
            message: "Token refreshed successfully",
            data: { token, user }
        });
    } catch (err) {
        res.status(401).json({ success: false, message: err.message });
    }
};

module.exports = { register, login, logout, getCurrentUser, refreshToken };
