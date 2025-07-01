const { Cart } = require('../models');

// Hàm tiện ích: Tạo cart nếu chưa có cho accountId, trả về cart
exports.createCartIfNotExists = async (accountId) => {
  if (!accountId) throw new Error('Thiếu accountId');
  let cart = await Cart.findOne({ where: { accountId } });
  if (!cart) {
    const cartId = 'CA' + Date.now();
    cart = await Cart.create({ cartId, accountId });
  }
  return cart;
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
  // Không cho phép xóa cart
  return res.status(403).json({ message: 'Không được phép xóa cart.' });
};

