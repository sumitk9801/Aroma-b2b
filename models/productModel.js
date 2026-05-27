const monogoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    image:{
        image_Url:{
                type: String,
        },
        public_id:{
            type: String,  
        }
    },
    
    skuCode:{
        type: String,
        required: true,
        unique: true
    },
    category: {
        type: String,
        required: true
    },
    pricePerKg:{
        type:Number,
        default:0.00
    },
    currentStock:{
        type:Number,
        default:0
    },
    minimunStock:{
        type:Number,
        default: 5
    }       
},{timestamps:true}); 

const Product = mongoose.model("Product", productSchema);
module.exports = Product;