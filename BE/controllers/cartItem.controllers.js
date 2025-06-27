const { CartItem, Product, Cart } = require("../models");

// Lấy tất cả cart items của khách hàng hiện tại
exports.getAllCartItems = async (req, res) => {
  try {
    // Kiểm tra xác thực
    if (!req.user || !req.user.accountId) {
      return res.status(401).json({ message: "Chưa đăng nhập hoặc thiếu thông tin tài khoản" });
    }
    // Lấy cartId của khách hàng hiện tại
    const cart = await Cart.findOne({ where: { accountId: req.user.accountId } });
    if (!cart) {
      return res.status(404).json({ message: "Khách hàng chưa có giỏ hàng" });
    }
    const cartItems = await CartItem.findAll({
      where: { cartId: cart.cartId },
      include: [
        { model: Product, as: "product" },
        { model: Cart, as: "cart" },
      ],
    });
    res.json(cartItems);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi lấy cart items", error });
  }
};

// Lấy cart item theo cartId và productId
exports.getCartItem = async (req, res) => {
    const { cartId, productId } = req.body;
    try {
      // Kiểm tra xác thực
      if (!req.user || !req.user.accountId) {
        return res.status(401).json({ message: "Chưa đăng nhập hoặc thiếu thông tin tài khoản" });
      }
      // Kiểm tra cartId có thuộc về accountId hiện tại không
      const cart = await Cart.findOne({ where: { cartId, accountId: req.user.accountId } });
      if (!cart) {
        return res.status(403).json({ message: "Bạn không có quyền truy cập cart item này" });
      }
      // Tìm cartItem với cartId và productId (chỉ của user hiện tại)
      const cartItem = await CartItem.findOne({
        where: { cartId: cart.cartId, productId },
        include: [
          { model: Product, as: "product" },
          { model: Cart, as: "cart" },
        ],
      });
      if (!cartItem) return res.status(404).json({ message: "Không tìm thấy cart item" });
      res.json(cartItem);
    } catch (error) {
      res.status(500).json({ message: "Lỗi server khi lấy cart item", error });
    }
  };

// Thêm cart item
exports.createCartItem = async (req, res) => {
  const { cartId, productId, quantity } = req.body;
  try {
    const [cartItem, created] = await CartItem.findOrCreate({
      where: { cartId, productId },
      defaults: { quantity },
    });
    if (!created) {
      // Nếu đã tồn tại thì cập nhật số lượng
      cartItem.quantity += quantity;
      await cartItem.save();
    }
    res.status(created ? 201 : 200).json(cartItem);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi thêm cart item", error });
  }
};

// Cập nhật số lượng cart item
exports.updateCartItem = async (req, res) => {
  const { cartId, productId } = req.body;
  const { quantity } = req.body;
  try {
    const cartItem = await CartItem.findOne({ where: { cartId, productId } });
    if (!cartItem) return res.status(404).json({ message: "Không tìm thấy cart item" });
    cartItem.quantity = quantity;
    await cartItem.save();
    res.json(cartItem);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi cập nhật cart item", error });
  }
};

// Xóa cart item
exports.deleteCartItem = async (req, res) => {
  const { cartId, productId } = req.body;
  try {
    const deleted = await CartItem.destroy({ where: { cartId, productId } });
    if (!deleted) return res.status(404).json({ message: "Không tìm thấy cart item để xóa" });
    res.json({ message: "Đã xóa cart item" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi xóa cart item", error });
  }
};
