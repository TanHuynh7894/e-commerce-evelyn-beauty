const express = require("express");
const router = express.Router();
const categoryForProductController = require("../controllers/categoryForProduct.controllers");
const {
  logCategoryForProductRequest,
} = require("../middlewares/categoryForProduct.middlewares");
const { verifyToken, requireRole } = require("../middlewares/auth");

// Route lấy tất cả categoryForProduct, chỉ cho OS và SF
router.get(
  "/all",
  verifyToken,
  requireRole("OS", "SF"),
  logCategoryForProductRequest,
  categoryForProductController.logAllCategoryForProduct
);

module.exports = router;
