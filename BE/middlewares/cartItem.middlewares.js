// Middleware kiểm tra body khi thêm/sửa cart item
const validateCartItemBody = (req, res, next) => {
  const { cartId, productId, quantity } = req.body;
  if (!cartId || !productId) {
    return res.status(400).json({ message: "cartId và productId là bắt buộc" });
  }
  if (quantity !== undefined && (!Number.isInteger(quantity) || quantity < 1)) {
    return res.status(400).json({ message: "quantity phải là số  dương" });
  }
  next();
};

// Middleware log request cart item
const logCartItemRequest = (req, res, next) => {
  console.log(`[CartItem Middleware] ${req.method} ${req.originalUrl}`);
  next();
};

module.exports = {
  validateCartItemBody,
  logCartItemRequest,
}; 