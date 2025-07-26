const express = require("express");
const router = express.Router();
const promotionProgramsController = require("../controllers/promotionPrograms.controllers");
const { verifyToken, requireRole } = require("../middlewares/auth");
const {
  paginate,
  validatePagination,
  logPromotionProgramRequest,
  validateCreatePromotionProgram,
  validateUpdateName,
  checkPromotionProgramExists,
} = require("../middlewares/promotionPrograms.middlewares");

// Lấy promotion programs đang hoạt động (cho role CU - Customer)
router.post(
  "/",
  verifyToken,
  requireRole("CU"),
  logPromotionProgramRequest,
  validatePagination,
  paginate,
  promotionProgramsController.getActivePromotionPrograms
);

// Tạo mới promotion program (cho role OS - Owner/Staff)
router.post(
  "/create", // 👈 rõ nghĩa, không trùng với route CU
  verifyToken,
  requireRole("OS", "SF"),
  logPromotionProgramRequest,
  validateCreatePromotionProgram,
  promotionProgramsController.createPromotionProgram
);
// Lấy tất cả promotion programs có status ON (cho role OS)
router.get(
  "/os/on",
  verifyToken,
  requireRole("OS", "SF"),
  logPromotionProgramRequest,
  validatePagination,
  paginate,
  promotionProgramsController.getOnPromotionProgramsForOS
);

// Update tên promotion program (cho role OS)
router.patch(
  "/programId",
  verifyToken,
  requireRole("OS"),
  logPromotionProgramRequest,
  checkPromotionProgramExists,
  validateUpdateName,
  promotionProgramsController.updatePromotionProgramName
);

// Soft delete a promotion program (cho role OS)
router.delete(
  "/programId",
  verifyToken,
  requireRole("OS", "SF"),
  logPromotionProgramRequest,
  checkPromotionProgramExists,
  promotionProgramsController.softDeletePromotionProgram
);

module.exports = router;
