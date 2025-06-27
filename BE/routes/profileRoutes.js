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
  requireRole("CU", "SF"),
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

// Route cho OS lấy tất cả profile của các account có role là SF
router.get(
  "/staff-all",
  verifyToken,
  requireRole("OS"),
  require("../controllers/profiles.controllers").getAllProfilesOfStaff
);

// Route cho OS tạo profile mới cho accountId có role là SF
router.post(
  "/staff-create",
  verifyToken,
  requireRole("OS"),
  require("../controllers/profiles.controllers").createProfileForStaff
);

// Route cho OS cập nhật profile của accountId có role là SF
router.put(
  "/staff-update",
  verifyToken,
  requireRole("OS"),
  require("../controllers/profiles.controllers").updateProfileOfStaff
);

// Route cho OS xóa profile của accountId có role là SF
router.delete(
  "/staff-delete",
  verifyToken,
  requireRole("OS"),
  require("../controllers/profiles.controllers").deleteProfileOfStaffById
);

module.exports = router;