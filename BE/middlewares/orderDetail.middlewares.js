// Middleware kiểm tra dữ liệu orderDetail
const validateOrderDetail = (req, res, next) => {
  const { productId, classificationId, orderId, quantity } = req.body;
  if (!productId || !classificationId || !orderId || !quantity) {
    return res.status(400).json({ message: "Thiếu thông tin bắt buộc!" });
  }
  next();
};

// Middleware log request orderDetail
const logOrderDetailRequest = (req, res, next) => {
  console.log(`[OrderDetail Middleware] ${req.method} ${req.originalUrl}`);
  next();
};

module.exports = {
  validateOrderDetail,
  logOrderDetailRequest,
};
