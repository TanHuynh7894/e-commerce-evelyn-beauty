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
router.post("/logout", accountController.logout); // Assuming logout will be a POST route for consistency or can be changed to GET/DELETE if needed.

// HomePage and Manage page routes (from auth.js originally)
router.get("/home", verifyToken, requireRole("CU", "SF", "OS"), (req, res) => {
  res.json({ message: "Chào mừng tới trang chính", user: req.user });
});

router.get("/manage", verifyToken, requireRole("SF", "OS"), (req, res) => {
  res.json({ message: "Chào mừng tới trang quản lý", user: req.user });
});

module.exports = router;
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Đăng nhập tài khoản
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *       401:
 *         description: Mật khẩu không đúng
 */
router.post("/login", accountController.loginAccount);
