const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/authMiddleware");
const { createShop, getShops, getShopById, updateShop } = require("../controllers/shopController");
const validate = require("../middleware/validate");
const { createShopSchema, updateShopSchema, getByIdSchema } = require("../middleware/validationSchemas");

router.post("/", auth, validate(createShopSchema), createShop);
router.get("/", auth, getShops);
router.get("/:id", auth, validate(getByIdSchema), getShopById);
router.patch("/:id", auth, validate(updateShopSchema), updateShop);

module.exports = router;