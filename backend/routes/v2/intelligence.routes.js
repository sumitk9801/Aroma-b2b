const express = require("express");
const router  = express.Router();
const { getVelocityClassification, getTurnoverAnalysis, getCapitalRisk, getLowStock } = require("../../controllers/v2/intelligence.controller");
const { auth, checkShopContext } = require("../../middleware/authMiddleware");

/**
 * V2 Inventory Intelligence Engine Routes
 * Base: /api/v2/intelligence
 */

// GET /api/v2/intelligence/velocity — ABC velocity classification
router.get("/velocity", auth, checkShopContext, getVelocityClassification);

// GET /api/v2/intelligence/turnover — Inventory turnover analysis
router.get("/turnover", auth, checkShopContext, getTurnoverAnalysis);

// GET /api/v2/intelligence/capital-risk — Dead stock + capital exposure analysis
router.get("/capital-risk", auth, checkShopContext, getCapitalRisk);

// GET /api/v2/intelligence/low-stock — Products below minimum stock threshold
router.get("/low-stock", auth, checkShopContext, getLowStock);

module.exports = router;
