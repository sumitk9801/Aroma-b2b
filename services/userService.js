const User = require("../models/userModel");
const BlackList = require("../models/blackListModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();


const register= async (userData) => {
    try{
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
            console.error("User already exists:", userData.email);
        }   
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        const newUser = new User({
            name: userData.name,
            email: userData.email,
            password: hashedPassword,
            role: userData.role || "customer"
        });
        const savedUser = await newUser.save();
        return savedUser;
    } catch (err) {
        console.error("Error registering user:", err.message);
    }                               
}

const login = async (loginData) => {
    try {
        const user = await User.findOne({ email: loginData.email });
        if (!user) {
            console.error("User not found with email:", loginData.email);
        }
        const isMatch = await bcrypt.compare(loginData.password, user.password);
        if (!isMatch) {
            console.error("Invalid password for email:", loginData.email);
        }
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

        return { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } };
    }catch (err) {
        console.error("Login error:", err.message);
    }
};

const getProfile = async (userId) => {
    try {
        const user = await User.findById(userId).select("-password");
        if (!user) {
            console.log("User not found with ID:", userId);
        }
        return user;
    } catch (err) {
        console.error("Error fetching user profile:", err);
    }
};

const logout = async (token) => {
    try {
        if (!token) {
            console.error("No token provided for logout");
        }
        await BlackList.create({
            token,
            expireAt: new Date(Date.now() + 5 * 60 * 60 * 1000)
        });
    } catch (err) {
        console.error("Error during logout:", err);
    }
};

module.exports = { register, login, getProfile, logout };