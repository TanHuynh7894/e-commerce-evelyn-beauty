const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controllers');
const { verifyToken } = require('../middlewares/auth');

// Lấy cart theo accountId
router.post('/getByAccount', verifyToken, cartController.getCartByAccountId);

// Xóa cart (API này luôn trả về lỗi, cart là bất biến)
router.delete('/delete', verifyToken, cartController.deleteCart);

// Không còn API tạo cart thủ công, cart được tạo tự động khi đăng nhập/đăng ký

module.exports = router; 