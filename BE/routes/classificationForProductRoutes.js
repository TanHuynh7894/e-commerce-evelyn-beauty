const express = require("express");
const router = express.Router();

const { verifyToken, requireRole } = require("../middlewares/auth");
const {
  getAllClassificationProducts,
  addClassificationProduct,
  updateClassificationProduct,
} = require("../controllers/classificationForProduct.controllers");

// Lấy tất cả classification-product (OS, SF)
router.get(
  "/",
  verifyToken,
  requireRole("OS", "SF"),
  getAllClassificationProducts
);

// Thêm classification-product (OS, SF)
router.post(
  "/",
  verifyToken,
  requireRole("OS", "SF"),
  addClassificationProduct
);

// Cập nhật quantity (OS, SF)
router.put(
  "/",
  verifyToken,
  requireRole("OS", "SF"),
  updateClassificationProduct
);

module.exports = router;
