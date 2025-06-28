const express = require("express");
const router = express.Router();

const { verifyToken, requireRole } = require("../middlewares/auth");

const {
  getAllClassifications,
  getClassificationById,
  createClassification,
  updateClassification,
  deleteClassification,
} = require("../controllers/classification.controllers");

const {
  validateClassificationId,
  validateCreateClassification,
  validateUpdateClassification,
} = require("../middlewares/classification.middlewares");

// Áp dụng middleware xác thực JWT (verifyToken) và chỉ cho phép role OS, SF cho tất cả routes
router.use(verifyToken);
router.use(requireRole("OS", "SF"));

// GET /api/classifications - Lấy tất cả classification có status ON
router.get("/", getAllClassifications);

// POST /api/classifications - Tạo classification mới
router.post("/", validateCreateClassification, createClassification);

// PUT /api/classifications/:classificationId - Cập nhật classification
router.put(
  "/:classificationId",
  validateClassificationId,
  validateUpdateClassification,
  updateClassification
);

// DELETE /api/classifications/:classificationId - Xóa classification
router.delete(
  "/:classificationId",
  validateClassificationId,
  deleteClassification
);

// GET /api/classifications/:classificationId - Lấy classification theo ID
router.get(
  "/:classificationId",
  validateClassificationId,
  getClassificationById
);

// Route cập nhật classification bằng query param
router.put(
  "/",
  (req, res, next) => {
    // Nếu có query classification thì gán vào req.classificationId để controller dùng
    if (req.query.classification) {
      req.classificationIdFromQuery = req.query.classification;
    }
    next();
  },
  validateUpdateClassification,
  updateClassification
);

// Route xóa classification bằng query param
router.delete(
  "/",
  (req, res, next) => {
    if (req.query.classification) {
      req.classificationIdFromQuery = req.query.classification;
    }
    next();
  },
  validateClassificationId,
  deleteClassification
);

module.exports = router;
