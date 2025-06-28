const { Category } = require("../models");
const CategoryProduct = require("../models/categoryForProduct");

//tạo mới category
const createCategory = async (req, res) => {
  try {
    const { role, accountId } = req.user;
    const { name } = req.body;
    if (role !== "SF" && role !== "OS") {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }
    if (!name) {
      return res.status(400).json({ message: "Thiếu tên category" });
    }
    // Tạo categoryId mới
    const categoryId = "CAT" + Date.now();
    const newCategory = await Category.create({
      categoryId,
      name,
      status: "ON",
      accountId,
    });
    return res.status(201).json({
      message: "Tạo category thành công",
      category: {
        categoryId: newCategory.categoryId,
        name: newCategory.name,
        status: newCategory.status,
        accountId: newCategory.accountId,
      },
    });
  } catch (error) {
    console.error("Lỗi khi tạo category:", error);
    return res.status(500).json({ message: "Lỗi server khi tạo category" });
  }
};

// Lấy tất cả categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { status: "ON" },
      attributes: ["categoryId", "name", "status", "accountId"],
    });
    return res.status(200).json({ categories });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách category:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server khi lấy danh sách category" });
  }
};

// SF và OS xóa category (chuyển status OFF)
const deleteCategoryById = async (req, res) => {
  try {
    const { role } = req.user;
    const { categoryId } = req.body;
    if (role !== "SF" && role !== "OS") {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }
    if (!categoryId) {
      return res.status(400).json({ message: "Thiếu categoryId" });
    }
    const category = await Category.findOne({
      where: { categoryId, status: "ON" },
    });
    if (!category) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy category hoặc đã OFF" });
    }
    // Kiểm tra liên kết với product_category
    const link = await CategoryProduct.findOne({ where: { categoryId } });
    if (link) {
      await category.update({ status: "OFF" });
      return res
        .status(200)
        .json({
          message: "Đã chuyển category sang OFF (vì có liên kết sản phẩm)",
        });
    } else {
      await category.destroy();
      return res
        .status(200)
        .json({
          message: "Đã xóa category vĩnh viễn (không có liên kết sản phẩm)",
        });
    }
  } catch (error) {
    console.error("Lỗi khi xóa category:", error);
    return res.status(500).json({ message: "Lỗi server khi xóa category" });
  }
};

// Cập nhật tên category (chỉ OS, SF)
const updateCategory = async (req, res) => {
  try {
    const { role } = req.user;
    const { categoryId, name } = req.body;
    if (role !== "SF" && role !== "OS") {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }
    if (!categoryId || !name) {
      return res.status(400).json({ message: "Thiếu categoryId hoặc tên mới" });
    }
    const category = await Category.findOne({
      where: { categoryId, status: "ON" },
    });
    if (!category) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy category hoặc đã OFF" });
    }
    await category.update({ name });
    return res
      .status(200)
      .json({ message: "Cập nhật tên category thành công", category });
  } catch (error) {
    console.error("Lỗi khi cập nhật category:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server khi cập nhật category" });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  deleteCategoryById,
  updateCategory,
};
