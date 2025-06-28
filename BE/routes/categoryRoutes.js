const express = require("express");
const router = express.Router();
const {
  createCategory,
  getAllCategories,
  deleteCategoryById,
  updateCategory,
} = require("../controllers/category.controllers");
const { verifyToken, requireRole } = require("../middlewares/auth");
const { validateCategoryName } = require("../middlewares/category.middlewares");

// Lấy tất cả categories - chỉ cho phép SF và OS
router.get("/", verifyToken, requireRole("SF", "OS"), getAllCategories);

//  tạo mới category
router.post(
  "/",
  verifyToken,
  requireRole("SF", "OS"),
  validateCategoryName,
  createCategory
);

// SF và OS xóa category (chuyển status OFF)
router.delete("/", verifyToken, requireRole("SF", "OS"), deleteCategoryById);

router.put("/update", verifyToken, updateCategory);

module.exports = router;
