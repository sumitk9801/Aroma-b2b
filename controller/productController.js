const productService = require("../services/productService");

const addProduct = async(req,res)=>{
    try{
        const result = await productService.addProduct(req.body,req.file);
        if(result.success){
            res.status(201).json({
                success: true,
                message: "Product added successfully",
                data: result.data
            });
        }
        else{
            res.status(400).json({
                success: false,
                message: result.message
            });
        }
      
    }
    catch(error){
        res.status(500).json({
            success: false,
            message: "Failed to add product"
        });
    }
}
const getProducts = async(req,res)=>{
    try{
        const result = await productService.getProducts();
        if(!result.success){
            return res.status(404).json({
                success: false,
                message: result.message
            });
        }
        res.status(200).json({
            success: true,
            message: "Products retrieved successfully", 
            data: result.data
        });
    }
    catch(error){
        res.status(500).json({
            success: false,
            message: "Failed to retrieve products"
        });
    }
}
const getProductById = async(req,res)=>{
    const {skuCode} = req.body;
    try{
        const result = await productService.getProductById(skuCode);
        if(result.success){
            res.status(200).json({
                success: true,
                message: "Product retrieved successfully", 
                data: result.data
            });
        }
        else{
            res.status(404).json({
                success: false,
                message: result.message
            });
        }
    }
    catch(error){
        res.status(500).json({
            success: false,
            message: "Failed to retrieve product"
        });
    }
}
const getProductName = async(req,res)=>{
    const {searchedName} = req.body;
    if(!searchedName){
        return res.status(400).json({
            success: false,
            message: "Search name is required"
        });
    }
    try{
        const result = await productService.getProductByName(searchedName);
        if(result.success){
            res.status(200).json({
                success: true,
                message: "Product retrieved successfully",
                data: result.data
            });
        }
        else{
            res.status(404).json({
                success: false, 
                message: result.message
            });
        }
    }
    catch(error){
        res.status(500).json({
            success: false,
            message: "Failed to retrieve product"
        });
    }
}

module.exports = { addProduct, getProducts, getProductById, getProductName };
