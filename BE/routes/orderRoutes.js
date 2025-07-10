const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controllers');
const { verifyToken, requireRole , logDbAccess } = require('../middlewares/auth');


// // Chỉ Customer được phép tạo order
// router.post('/', verifyToken, requireRole('CU'), orderController.createOrder);

// // Customer chỉ xem được đơn hàng của mình
// router.get('/my-orders', verifyToken, requireRole('CU'), orderController.getCustomerOrders);

// // Staff/OS xem được tất cả đơn hàng + ghi log
// router.get('/', verifyToken, requireRole('SF', 'OS'), logDbAccess, orderController.getAllOrders);

// // Chỉ Staff/OS được phép cập nhật status đơn hàng + ghi log
// router.put('/:orderId', verifyToken, requireRole('SF', 'OS'), logDbAccess, orderController.updateOrderStatus);

//lấy thông tin giao hàng
router.get('/', verifyToken, orderController.getDeliveryAddress);

module.exports = router;