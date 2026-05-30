const express = require("express");
const router = express.Router();
const { register, login, logout, getCurrentUser, refreshToken } = require("../controllers/authController");
const { auth } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { registerSchema, loginSchema } = require("../middleware/validationSchemas");

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/logout", auth, logout);
router.get("/me", auth, getCurrentUser);
router.post("/refresh-token", refreshToken);

module.exports = router;