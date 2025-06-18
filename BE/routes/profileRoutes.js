const express = require("express");
const router = express.Router();
const {
  getMyProfile,
  createProfile,
  getAllProfilesOfAccount,
  updateProfileById,
  deleteProfileById,
} = require("../controllers/profiles.controllers");
const { verifyToken, requireRole } = require("../middlewares/auth");
const {
  validateProfileData,
  checkProfileExists,
  checkProfileNotExists,
  sanitizeProfileData,
  validatePhoneFormat,
  profileRateLimit,
} = require("../middlewares/profiles.middlewares");

//Lấy tất cả profile của customer hiện tại
// GET /api/profiles
router.get(
  "/",
  verifyToken,
  requireRole("CU"),
  profileRateLimit,
  getAllProfilesOfAccount
);

//Lấy 1 profile đầu tiên của customer hiện tại (giữ nguyên route này nếu cần)
router.get(
  "/my-profile",
  verifyToken,
  requireRole("CU"),
  profileRateLimit,
  getMyProfile
);

//Tạo profile mới cho customer
// POST /api/profiles
router.post(
  "/",
  verifyToken,
  requireRole("CU"),
  profileRateLimit,
  sanitizeProfileData,
  validateProfileData,
  validatePhoneFormat,
  createProfile
);

//Cập nhật profile theo profileId truyền qua query string
router.put(
  "/profileId",
  verifyToken,
  requireRole("CU"),
  profileRateLimit,
  sanitizeProfileData,
  validateProfileData,
  validatePhoneFormat,
  updateProfileById
);

//Xóa profile theo profileId truyền qua query string
router.delete(
  "/profileId",
  verifyToken,
  requireRole("CU"),
  profileRateLimit,
  deleteProfileById
);

module.exports = router;
