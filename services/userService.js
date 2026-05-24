const User = require("../model/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


const register= async (userData) => {
    try{
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
            throw new Error("User already exists");
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
        throw new Error(err.message);
    }                               
}

const login = async (loginData) => {
    try {
        const user = await User.findOne({ email: loginData.email });
        if (!user) {
            throw new Error("Invalid email or password");
        }
        const isMatch = await bcrypt.compare(loginData.password, user.password);
        if (!isMatch) {
            throw new Error("Invalid email or password");
        }
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
        return { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } };
    } catch (err) {
        throw new Error(err.message);
    }
};

const getProfile = async (userId) => {
    try {
        const user = await User.findById(userId).select("-password");
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    } catch (err) {
        throw new Error(err.message);
    }
};

const logout = async (userId) => {
    try {
        await BlackList.create({ token }); 
    } catch (err) {
        throw new Error(err.message);
    }
};

module.exports = { register, login, getProfile, logout };