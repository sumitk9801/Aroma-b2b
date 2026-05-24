const mongoose = require("mongoose");
const blackListSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true
    },
    expireAt: {
        type: Date,
        required: true, 
        index: { expires: '5h'} //5hour expiration
    }
});
const BlackList = mongoose.model("BlackList", blackListSchema);
module.exports = BlackList;