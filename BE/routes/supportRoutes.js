const express = require("express");
const router = express.Router();
const {
  createSupport,
  getAllSupports,
  getSupportById,
  resolveSupport,
  deleteSupport,
} = require("../controllers/supports.controllers");
const { verifyToken, requireRole } = require("../middlewares/auth");
const { canAccessSupport } = require("../middlewares/support.middlewares");

// Tất cả route đều cần xác thực
router.use(verifyToken);

// Customer tạo support
router.post("/", createSupport);

// Lấy tất cả support của mình
router.get("/", getAllSupports);

// Lấy support theo id
router.post("/detail", canAccessSupport, getSupportById);

// Staff xử lý support
router.put("/resolve", requireRole("SF"), resolveSupport);

// Customer xóa support của mình khi chưa xử lý
router.delete("/", canAccessSupport, deleteSupport);

module.exports = router;
