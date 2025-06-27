const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controllers');

// Tạo URL thanh toán VNPAY
router.post('/vnpay/create-url', paymentController.createPaymentUrl);

// Callback khi thanh toán xong
router.get('/vnpay/callback', paymentController.verifyVnpayCallback);

module.exports = router;
