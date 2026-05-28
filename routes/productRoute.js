const productController = require('../controller/productController');
const express = require('express');
const router = express.Router();
const upload = require('../middleware/multer');
const {auth,authorize} = require('../middleware/authMiddleware');

router.post('/add',auth,authorize,upload.single('image'), productController.addProduct);
router.get('/get', productController.getProducts);
router.post('/getbyId', productController.getProductById);
router.post('/search', productController.getProductName);

module.exports = router;
