const uploadService = require("../services/uploadService");

const uploadProductImage = async (req, res) => {
    try {
        const data = await uploadService.uploadProductImage(req.file);
        res.status(200).json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const deleteProductImage = async (req, res) => {
    try {
        await uploadService.deleteProductImage(req.params.publicId);
        res.status(200).json({
            success: true,
            message: "Image deleted successfully"
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { uploadProductImage, deleteProductImage };
