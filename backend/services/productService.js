const { prisma } = require("../db/db");

const mapProduct = (product) => {
    if (!product) return null;
    return {
        ...product,
        imageUrl: product.image
    };
};

const createProduct = async (productData) => {
    const { shopId, categoryId, name, description, skuCode, barcodes, image, imageUrl, purchasePrice, sellingPrice, currentStock, minimumStock, isActive } = productData;
    const finalImage = image || imageUrl;
    const product = await prisma.product.create({
        data: {
            shopId,
            categoryId,
            name,
            description,
            skuCode,
            barcodes,
            image: finalImage || null,
            purchasePrice: parseFloat(purchasePrice || 0.0),
            sellingPrice: parseFloat(sellingPrice || 0.0),
            currentStock: parseFloat(currentStock || 0.0),
            minimumStock: parseFloat(minimumStock || 5.0),
            isActive: isActive !== undefined ? isActive : true
        }
    });
    return mapProduct(product);
};

const getAllProducts = async (shopId) => {
    const where = {};
    if (shopId) {
        where.shopId = shopId;
    }
    const products = await prisma.product.findMany({
        where,
        include: {
            shop: { select: { id: true, shopName: true } },
            categoryRef: { select: { id: true, name: true } }
        }
    });
    return products.map(mapProduct);
};

const getProductById = async (id, shopId) => {
    const product = await prisma.product.findUnique({
        where: { id },
        include: {
            shop: { select: { id: true, shopName: true } },
            categoryRef: { select: { id: true, name: true } }
        }
    });
    if (!product || (shopId && product.shopId !== shopId)) {
        throw new Error("Product not found");
    }
    return mapProduct(product);
};

const updateProduct = async (id, updateData, shopId) => {
    const productExists = await prisma.product.findUnique({ where: { id } });
    if (!productExists || (shopId && productExists.shopId !== shopId)) {
        throw new Error("Product not found");
    }
    const { name, description, skuCode, barcodes, image, imageUrl, purchasePrice, sellingPrice, currentStock, minimumStock, isActive } = updateData;
    const finalImage = image !== undefined ? image : (imageUrl !== undefined ? imageUrl : undefined);
    const product = await prisma.product.update({
        where: { id },
        data: {
            name,
            description,
            skuCode,
            barcodes,
            image: finalImage,
            purchasePrice: purchasePrice !== undefined ? parseFloat(purchasePrice) : undefined,
            sellingPrice: sellingPrice !== undefined ? parseFloat(sellingPrice) : undefined,
            currentStock: currentStock !== undefined ? parseFloat(currentStock) : undefined,
            minimumStock: minimumStock !== undefined ? parseFloat(minimumStock) : undefined,
            isActive
        }
    });
    return mapProduct(product);
};

const deleteProduct = async (id, shopId) => {
    const productExists = await prisma.product.findUnique({ where: { id } });
    if (!productExists || (shopId && productExists.shopId !== shopId)) {
        throw new Error("Product not found");
    }
    return await prisma.product.delete({ where: { id } });
};

const getLowStockProducts = async (shopId) => {
    const where = {};
    if (shopId) {
        where.shopId = shopId;
    }
    const products = await prisma.product.findMany({
        where,
        include: { shop: { select: { id: true, shopName: true } } }
    });
    return products.filter(p => p.currentStock <= p.minimumStock).map(mapProduct);
};

const searchProducts = async (searchTerm, shopId) => {
    if (!searchTerm) return [];
    const where = {
        OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } },
            { barcodes: { contains: searchTerm, mode: "insensitive" } },
            { skuCode: { contains: searchTerm, mode: "insensitive" } }
        ]
    };
    if (shopId) {
        where.shopId = shopId;
    }
    const products = await prisma.product.findMany({
        where,
        include: {
            shop: { select: { id: true, shopName: true } },
            categoryRef: { select: { id: true, name: true } }
        }
    });
    return products.map(mapProduct);
};

const filterProducts = async (filters) => {
    const { shopId, categoryId, minPrice, maxPrice, isActive, lowStock } = filters;
    const where = {};
    
    if (shopId) where.shopId = shopId;
    if (categoryId) where.categoryId = categoryId;
    if (isActive !== undefined) where.isActive = isActive === "true" || isActive === true;
    
    if (minPrice !== undefined || maxPrice !== undefined) {
        where.sellingPrice = {};
        if (minPrice !== undefined) where.sellingPrice.gte = parseFloat(minPrice);
        if (maxPrice !== undefined) where.sellingPrice.lte = parseFloat(maxPrice);
    }
    
    const products = await prisma.product.findMany({
        where,
        include: {
            shop: { select: { id: true, shopName: true } },
            categoryRef: { select: { id: true, name: true } }
        }
    });
    
    const mapped = products.map(mapProduct);
    
    if (lowStock === "true" || lowStock === true) {
        return mapped.filter(p => p.currentStock <= p.minimumStock);
    }
    
    return mapped;
};

module.exports = { 
    createProduct, 
    getAllProducts, 
    getProductById, 
    updateProduct, 
    deleteProduct, 
    getLowStockProducts,
    searchProducts,
    filterProducts
};

