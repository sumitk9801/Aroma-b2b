const Product = require('../models/productModel');
const cloudinary = require('../config/cloudinary');

const addProduct=async(productData,productImage)=>{
    try{
        const { name, description, skuCode, category, pricePerKg, currentStock, minimunStock } = productData || {};
        if(!name || !skuCode || !category || pricePerKg == null || currentStock == null){
            return { success: false, message: "Missing required fields" };
        }
        if(!productImage){
            return { success: false, message: "Product image is required" };
        }
        const b64 = Buffer.from(productImage.buffer).toString('base64');
        const dataURI = `data:${productImage.mimetype};base64,${b64}`;
        const uploadedImage = await cloudinary.uploader.upload(dataURI, {
            folder: "products"
        });
        const newProduct = new Product({
            name,
            description,
            image:{
                imageUrl: uploadedImage.secure_url,
                public_id: uploadedImage.public_id
            },
            skuCode,
            category,
            pricePerKg,
            currentStock,
            minimunStock
        });
        const savedProduct = await newProduct.save();
        return { success: true, data: savedProduct };
    }
    catch(error){
        return { success: false, message: "Failed to add product" };
    }
}
const getProducts = async()=>{
    try{
        const products = await Product.find().select('-__v');
        if(products.length === 0){
            return { success: false, message: "No products found" };
        }
        return { success: true, data: products };
    }
    catch(error){
        return { success: false, message: "Failed to retrieve products" };
    }
}
const getProductById = async(skuCode)=>{
    try{
        const product = await Product.findOne({ skuCode }).select("-image.public_id -__v");
        if(!product){
            return { success: false, message: "Product not found" };
        }
        return { success: true, data: product };
    }
    catch(error){
        return { success: false, message: "Failed to retrieve product" };
    }
}
const getProductByName = async(searchedName)=>{
    try{
        const product = await Product.findOne({ name: {
            $regex: searchedName,
            $options: "i"
        } }).select("-image.public_id -__v");
        if(!product){
            return { success: false, message: "Product not found" };
        }
        return { success: true, data: product };
    }
    catch(error){
        return { success: false, message: "Failed to retrieve product" };
    }
}
module.exports = {
    addProduct,
    getProducts,    
    getProductById,
    getProductByName
}
