const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controllers');
const { verifyToken, requireRole } = require('../middlewares/auth');

// Tạo mã QR cho đơn hàng cụ thể
router.post('/create-payos', verifyToken, requireRole('CU'), paymentController.createPayOSLink);
router.post('/payos/webhook', paymentController.handlePayOSWebhook);

module.exports = router;
