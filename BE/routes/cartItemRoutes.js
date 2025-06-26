const express = require("express");
const router = express.Router();
const cartItemController = require("../controllers/cartItem.controllers");
const {validateCartItemBody,logCartItemRequest,} = require("../middlewares/cartItem.middlewares");
const { verifyToken } = require("../middlewares/auth");


// Lấy tất cả cart items (chỉ của khách hàng hiện tại)
router.get("/", verifyToken, logCartItemRequest, cartItemController.getAllCartItems);

// Lấy 1 cart item (body: cartId, productId)
router.post("/get-one", verifyToken, logCartItemRequest, cartItemController.getCartItem);

// Thêm cart item (body: cartId, productId, quantity)
router.post("/add", verifyToken, validateCartItemBody, logCartItemRequest, cartItemController.createCartItem);

// Cập nhật số lượng cart item (body: cartId, productId, quantity)
router.put("/update",verifyToken,validateCartItemBody,logCartItemRequest,cartItemController.updateCartItem);

// Xóa cart item (body: cartId, productId)
router.delete("/delete",verifyToken,logCartItemRequest,cartItemController.deleteCartItem);

module.exports = router; 