const express = require("express");
const router = express.Router();
const cartItemController = require("../controllers/cartItem.controllers");
const {
  validateCartItemBody,
  logCartItemRequest,
} = require("../middlewares/cartItem.middlewares");
const { verifyToken, requireRole } = require("../middlewares/auth");

// Lấy tất cả cart items (chỉ của khách hàng hiện tại)
router.get(
  "/",
  verifyToken,
  requireRole("CU"),
  logCartItemRequest,
  cartItemController.getAllCartItems
);

// Lấy tất cả cart items đã thanh toán (status = 'OFF') của khách hàng hiện tại
router.get(
  "/paid",
  verifyToken,
  requireRole("CU"),
  cartItemController.getAllPaidCartItems
);

// Thêm cart item (body: cartId, productId,classificationId, quantity)
router.post(
  "/add",
  verifyToken,
  requireRole("CU"),
  validateCartItemBody,
  logCartItemRequest,
  cartItemController.createCartItem
);

// Cập nhật số lượng cart item (body: cartId, productId,classificationId, quantity)
router.put(
  "/update",
  verifyToken,
  requireRole("CU"),
  validateCartItemBody,
  logCartItemRequest,
  cartItemController.updateCartItem
);

// Xóa cart item (body: cartId, productId,classificationId)
router.delete(
  "/delete",
  verifyToken,
  requireRole("CU"),
  logCartItemRequest,
  cartItemController.deleteCartItem
);

module.exports = router;
