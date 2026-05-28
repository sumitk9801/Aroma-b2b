const express = require("express");
const router = express.Router();
const User = require("../controller/userController");
const { auth } = require("../middleware/authMiddleware");

router.post("/register",User.register);
router.post("/login",User.login);
router.get("/profile", auth, User.getProfile);
router.post("/logout", auth, User.logout);


module.exports = router;
