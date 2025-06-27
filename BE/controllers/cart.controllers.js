const { Cart } = require('../models');

// Tạo cart mới
exports.createCart = async (req, res) => {
    try {
      const { accountId } = req.body;
      if (!accountId) {
        return res.status(400).json({ message: 'Thiếu accountId' });
      }
      // Kiểm tra đã có cart cho accountId này chưa
      const existingCart = await Cart.findOne({ where: { accountId } });
      if (existingCart) {
        return res.status(400).json({ message: 'Account này đã có cart!' });
      }
      const cartId = 'CA' + Date.now();
      const cart = await Cart.create({ cartId, accountId });
      res.status(201).json(cart);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi tạo cart', error: error.message });
    }
  };

// Lấy cart theo accountId (body)
exports.getCartByAccountId = async (req, res) => {
  try {
    const { accountId } = req.body;
    if (!accountId) return res.status(400).json({ message: 'Thiếu accountId' });
    const cart = await Cart.findOne({ where: { accountId } });
    if (!cart) return res.status(404).json({ message: 'Không tìm thấy cart' });
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy cart', error: error.message });
  }
};

// Xóa cart (body)
exports.deleteCart = async (req, res) => {
  try {
    const { cartId } = req.body;
    const { accountId } = req.user;
    if (!cartId) return res.status(400).json({ message: 'Thiếu cartId' });
    // Chỉ xóa cart nếu cartId thuộc về accountId hiện tại
    const deleted = await Cart.destroy({ where: { cartId, accountId } });
    if (!deleted) return res.status(404).json({ message: 'Không tìm thấy cart hoặc không có quyền' });
    res.json({ message: 'Đã xóa cart' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi xóa cart', error: error.message });
  }
};


