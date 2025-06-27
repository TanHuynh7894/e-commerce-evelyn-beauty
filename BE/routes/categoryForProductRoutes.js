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

// Route tạo categoryForProduct, chỉ cho OS và SF
router.post(
  "/create",
  verifyToken,
  requireRole("OS", "SF"),
  logCategoryForProductRequest,
  categoryForProductController.createCategoryForProduct
);

// Route xóa categoryForProduct, chỉ cho OS và SF
router.delete(
  "/delete",
  verifyToken,
  requireRole("OS", "SF"),
  logCategoryForProductRequest,
  categoryForProductController.deleteCategoryForProduct
);

// Route cập nhật categoryForProduct, chỉ cho OS và SF
router.put(
  "/update",
  verifyToken,
  requireRole("OS", "SF"),
  logCategoryForProductRequest,
  categoryForProductController.updateCategoryForProduct
);

module.exports = router;