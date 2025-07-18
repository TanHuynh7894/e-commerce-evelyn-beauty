const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controllers');
const { verifyToken, requireRole } = require('../middlewares/auth');

// Tạo mã QR cho đơn hàng cụ thể
router.post('/create-payos', verifyToken, requireRole('CU'), paymentController.createPayOSLink);
router.all('/payos/webhook', async (req, res) => {
  try {
    await paymentController.handlePayOSWebhook(req, res);
  } catch (err) {
    console.error(" Lỗi xử lý webhook:", err.message);
    res.sendStatus(500);
  }
  // res.sendStatus(200); 
  // console.log("Webhook PayOS đã nhận và xử lý thành công");
});
router.get('/transaction/:orderCode', verifyToken, requireRole('OS','SF'), paymentController.getTransactionInfo);
router.post('/cancel-order/:orderCode', paymentController.cancelOrderByClient);

module.exports = router;