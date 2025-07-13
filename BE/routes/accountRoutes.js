const express = require("express");
const router = express.Router();
const accountController = require("../controllers/accounts.controllers");
const {verifyToken,requireRole,validatePassword,validateEmail,} = require("../middlewares/auth");
const passport = require("../auth/passport");
const {
  createAccountWithOtp,
  getAllAccounts,
  updateAccount,
  deleteAccount,
} = require("../controllers/accounts.controllers");

// OTP routes
router.post("/verify-otp", accountController.verifyOtp);

// Auth routes
router.post("/login", validateEmail,accountController.loginAccount);
router.post("/register", validatePassword,validateEmail, accountController.registerAccount);
router.post("/google", accountController.googleLogin);

// Quên mật khẩu (JWT không lưu DB)
router.post("/forgot-password", validateEmail,accountController.forgotPassword);
router.post(
  "/reset-password",
  validateEmail,
  validatePassword,
  accountController.resetPassword
);

//Logout route
router.post("/logout", accountController.logout);

//Protected routes (từ protectedRoutes.js gộp vào)
router.get("/home", verifyToken, requireRole("CU", "SF", "OS"), (req, res) => {
  res.json({
    message: " Chào mừng tới trang chính",
    user: req.user,
  });
});

router.get("/manage", verifyToken, requireRole("SF", "OS"), (req, res) => {
  res.json({
    message: " Truy cập trang quản lý",
    user: req.user,
  });
});

router.get("/admin", verifyToken, requireRole("OS"), (req, res) => {
  res.json({
    message: " Truy cập trang quản trị",
    user: req.user,
  });
});

//  Test route
router.get("/", verifyToken, (req, res) => {
  res.json({
    message: " Truy cập thành công",
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

router.post("/create",verifyToken,validateEmail,validatePassword,requireRole("OS"),createAccountWithOtp);
router.post("/verify-otp-account",validateEmail, accountController.verifyAdminOtpOnly);
router.get("/all", verifyToken, requireRole("OS"), getAllAccounts);
router.put("/update/:accountId", verifyToken, requireRole("OS"), updateAccount);
router.delete("/delete/:accountId",verifyToken,requireRole("OS"),deleteAccount);

module.exports = router;
