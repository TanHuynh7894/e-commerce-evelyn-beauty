const express = require("express");
const router = express.Router();
const orderDetailController = require("../controllers/orderDetail.controllers");
const {
  logOrderDetailRequest,
} = require("../middlewares/orderDetail.middlewares");
const { verifyToken, requireRole } = require("../middlewares/auth");

// // Tạo mới orderDetail
// router.post(
//   "/",
//   verifyToken,
//   requireRole("CU"),
//   logOrderDetailRequest,
//   validateOrderDetail,
//   orderDetailController.createOrderDetail
// );
// // Lấy tất cả orderDetail theo orderId (bằng body)
// router.post(
//   "/get-all",
//   verifyToken,
//   requireRole("CU"),
//   logOrderDetailRequest,
//   orderDetailController.getAllOrderDetails
// );
// // Lấy orderDetail theo id (bằng body)
// router.post(
//   "/get-by-id",
//   verifyToken,
//   requireRole("CU"),
//   logOrderDetailRequest,
//   orderDetailController.getOrderDetailById
// );
// Cập nhật orderDetail (bằng body)
router.put(
  "/update",
  verifyToken,
  requireRole("CU"),
  logOrderDetailRequest,
  orderDetailController.updateOrderDetail
);
// Xóa orderDetail (bằng body)
router.post(
  "/delete",
  verifyToken,
  requireRole("CU"),
  logOrderDetailRequest,
  orderDetailController.deleteOrderDetail
);
// Route đánh giá sản phẩm
router.post(
  "/rate",
  verifyToken,
  requireRole("CU"),
  orderDetailController.rateProduct
);
module.exports = router;
