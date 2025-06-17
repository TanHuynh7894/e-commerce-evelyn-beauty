const express = require("express");
const router = express.Router();
const accountController = require("../controllers/accounts.controllers");
const { verifyToken, requireRole } = require("../middlewares/auth");
const passport = require("../auth/passport");

// OTP routes
router.post("/verify-otp", accountController.verifyOtp);

// Auth routes
router.post("/login", accountController.loginAccount);
router.post("/register", accountController.registerAccount);
router.post("/google", accountController.googleLogin);

// ➕ Quên mật khẩu (JWT không lưu DB)
router.post("/forgot-password", accountController.forgotPassword);
router.post("/reset-password", accountController.resetPassword);

// Protected routes
router.get("/", verifyToken, (req, res) => {
  res.json({
    message: "✅ Truy cập thành công",
    user: req.user,
  });
});

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  (req, res) => {
    res.json({
      message: "Đăng nhập Google thành công!",
      user: req.user,
    });
  }
);

// Logout route
router.post("/logout", accountController.logout);

// HomePage and Manage page routes (from auth.js originally)
router.get("/home", verifyToken, requireRole("CU", "SF", "OS"), (req, res) => {
  res.json({ message: "Chào mừng tới trang chính", user: req.user });
});

router.get("/manage", verifyToken, requireRole("SF", "OS"), (req, res) => {
  res.json({ message: "Chào mừng tới trang quản lý", user: req.user });
});

module.exports = router;
