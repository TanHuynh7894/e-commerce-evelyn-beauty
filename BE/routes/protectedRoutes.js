const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middlewares/auth');

router.get('/home', verifyToken, requireRole("CU", "SF", "OS"), (req, res) => {
  res.json({
    message: '✅ Chào mừng tới trang chính',
    user: req.user
  });
});

router.get('/manage', verifyToken, requireRole("SF", "OS"), (req, res) => {
  res.json({
    message: '👑 Truy cập trang quản lý',
    user: req.user
  });
});

module.exports = router;

