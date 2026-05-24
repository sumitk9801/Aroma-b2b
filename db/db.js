const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const connectdb = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL|| "mongodb://localhost:27017/aroma-b2b");
        console.log("Database connected successfully");
    } catch (err) {
        console.log(err.message);
    }
}

module.exports = connectdb;