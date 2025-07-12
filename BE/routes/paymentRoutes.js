const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controllers');
const { verifyToken, requireRole } = require('../middlewares/auth');

// Tạo mã QR cho đơn hàng cụ thể
router.post('/create-payos', verifyToken, requireRole('CU'), paymentController.createPayOSLink);
router.post('/payos/webhook', async (req, res) => {
  console.log("📥 ĐÃ NHẬN WEBHOOK từ PayOS:");
  console.log("📝 Body:", req.body);

  try {
    await paymentController.handlePayOSWebhook(req, res);
  } catch (err) {
    console.error("❌ Lỗi xử lý webhook:", err.message);
    res.sendStatus(500);
  }
});

module.exports = router;