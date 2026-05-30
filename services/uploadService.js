const cloudinary = require("../config/cloudinary");

const uploadProductImage = async (file) => {
    if (!file) {
        throw new Error("No image file provided");
    }
    
    // Convert file buffer to base64 data URI
    const b64 = Buffer.from(file.buffer).toString("base64");
    const dataURI = `data:${file.mimetype};base64,${b64}`;
    
    const uploadedImage = await cloudinary.uploader.upload(dataURI, {
        folder: "products"
    });
    
    return {
        imageUrl: uploadedImage.secure_url,
        public_id: uploadedImage.public_id
    };
};

const deleteProductImage = async (publicId) => {
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result !== "ok") {
        throw new Error("Failed to delete image from Cloudinary");
    }
    return true;
};

module.exports = { uploadProductImage, deleteProductImage };
