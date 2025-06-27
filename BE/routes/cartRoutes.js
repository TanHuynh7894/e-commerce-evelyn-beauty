const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controllers');
const { verifyToken } = require('../middlewares/auth');
const { validateCreateCart } = require('../middlewares/cart.middlewares');

// Tạo cart mới
router.post('/create', verifyToken, validateCreateCart, cartController.createCart);

// Lấy cart theo accountId
router.post('/getByAccount', verifyToken, cartController.getCartByAccountId);

// Xóa cart
router.delete('/delete', verifyToken, cartController.deleteCart);



module.exports = router; 