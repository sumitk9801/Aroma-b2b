const express = require("express");
const router = express.Router();
const User = require("../controller/userController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register",User.register);
router.post("/login",User.login);
router.post("/logout",authMiddleware,User.logout);


module.exports = router;