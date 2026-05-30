const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/authMiddleware");
const { uploadProductImage, deleteProductImage } = require("../controllers/uploadController");
const upload = require("../middleware/multer");

router.post("/product-image", auth, upload.single("image"), uploadProductImage);
router.delete("/product-image/:publicId", auth, deleteProductImage);

module.exports = router;