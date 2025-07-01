const { ClassificationProduct } = require("../models");

// Middleware kiểm tra body khi thêm/sửa cart item
const validateCartItemBody = async (req, res, next) => {
  const { cartId, productId, classificationId, quantity } = req.body;
  if (!cartId || !productId || !classificationId) {
    return res.status(400).json({ message: "cartId, productId và classificationId là bắt buộc" });
  }
  if (quantity !== undefined && (!Number.isInteger(quantity) || quantity < 1)) {
    return res.status(400).json({ message: "quantity phải là số dương" });
  }
  // Kiểm tra tồn kho trong classification-for-product
  try {
    const classificationForProduct = await ClassificationProduct.findOne({
      where: { productId, classificationId }
    });
    if (!classificationForProduct || classificationForProduct.quantity < quantity) {
      return res.status(400).json({ message: "Sản phẩm này không đủ số lượng tồn kho. Vui lòng chọn sản phẩm khác." });
    }
  } catch (err) {
    return res.status(500).json({ message: "Lỗi kiểm tra tồn kho sản phẩm", error: err.message });
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