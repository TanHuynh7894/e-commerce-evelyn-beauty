const express = require('express');
const router = express.Router();
const controller = require('../controllers/login');
const { verifyToken, requireRole } = require('../middlewares/auth');
const { getAllProductIds } = require('../controllers/topSeller');

// 🔐 Đăng nhập bằng email/mật khẩu
router.post('/login', controller.loginAccount);

// 🆕 Đăng ký tài khoản truyền thống
router.post('/register', controller.registerAccount);

// 🌐 Đăng nhập / Đăng ký bằng Google
router.post('/google', controller.googleLogin);

//top seller
router.get('/product-reccommended', getAllProductIds); 

// 🏠 Trang homePage (vai trò: CU, SF, OS đều vào được)
router.get('/home', verifyToken, requireRole('CU', 'SF', 'OS'), (req, res) => {
  res.json({ message: 'Chào mừng tới trang chính', user: req.user });
});

// ⚙️ Trang manage (chỉ SF hoặc OS được vào)
router.get('/manage', verifyToken, requireRole('SF', 'OS'), (req, res) => {
  res.json({ message: 'Chào mừng tới trang quản lý', user: req.user });
});



module.exports = router;
