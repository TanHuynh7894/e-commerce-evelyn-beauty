const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controllers');
const { verifyToken, requireRole } = require('../middlewares/auth');

// Tạo mã QR cho đơn hàng cụ thể
router.get('/vietqr/:orderId', verifyToken, requireRole('CU'), paymentController.generateVietQRFromOrder);

module.exports = router;
