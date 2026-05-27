const Product = require('../models/productModel');
const cloudinary = require('../utils/cloudinaryConfig');

const addProduct=async(productData,productImage)=>{
    const {name, description,skuCode,pricePerKg,currentStock,minimunStock} = productData;
    try{
        if(!name || !skuCode || !pricePerKg || !currentStock || !minimunStock){
            return { success: false, message: "Missing required fields" };
        }
        const b64 = Buffer.from(productImage.buffer).toString('base64');
        const dataURI = `data:${productImage.mimetype};base64,${b64}`;
        const uploadedImage = await cloudinary.uploader.upload(dataURI, {
            folder: "products"
        });
        const newProduct = new Product({
            name: productData.name,
            description: productData.description,
            imageUrl: uploadedImage.secure_url,
            public_id: uploadedImage.public_id,
            skuCode: productData.skuCode,
            pricePerKg: productData.pricePerKg,
            currentStock: productData.currentStock,
            minimunStock: productData.minimunStock
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
        const product = await Product.findOne({ skuCode }).select("-public_id");
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
        } }).select("-public_id");
        if(!product){
            return { success: false, message: "Product not found" };
        }
        return { success: true, data: product };
    }
    catch(error){
        return { success: false, message: "Failed to retrieve product" };
    }
}