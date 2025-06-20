// Middleware kiểm tra name không được rỗng
const validateCategoryName = (req, res, next) => {
  const { name } = req.body;
  if (!name || name.trim() === "") {
    return res
      .status(400)
      .json({ message: "Tên category không được để trống" });
  }
  next();
};

module.exports = { validateCategoryName };
