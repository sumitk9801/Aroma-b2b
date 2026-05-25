const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userService = require("../services/userService");

exports.register = async (req, res) => {
    try {
        const result = await userService.register(req.body);
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: result
        });
    } catch (err) {
        res.status(500).json({
            success: false, 
            message: err.message
        });
    }   
}

exports.login = async (req, res) => {
    try {
        const result = await userService.login(req.body);
        res.status(200).json({  
            success: true,
            message: "User logged in successfully",
            data: result.token
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }       
}

exports.getProfile = async (req, res) => {
    try {
        const result = await userService.getProfile(req.user.id); 
        res.status(200).json({
            success: true,
            message: "Profile retrieved successfully",
            data: result
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

exports.logout = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const logoutResult = await userService.logout(token);
        res.status(200).json({
            success: true,
            message: "User logged out successfully"
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
