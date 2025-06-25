// Middleware kiểm tra dữ liệu tạo cart
exports.validateCreateCart = (req, res, next) => {
  const { accountId } = req.body;
  if (!accountId) {
    return res.status(400).json({ message: 'Thiếu accountId' });
  }
  next();
}; 