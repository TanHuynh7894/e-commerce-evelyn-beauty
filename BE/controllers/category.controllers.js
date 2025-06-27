const { Category } = require("../models");

// OS tạo mới category
const createCategory = async (req, res) => {
  try {
    const { role, accountId } = req.user;
    const { name } = req.body;
    if (role !== "OS") {
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
    await category.update({ status: "OFF" });
    return res.status(200).json({ message: "Đã chuyển category sang OFF" });
  } catch (error) {
    console.error("Lỗi khi xóa category:", error);
    return res.status(500).json({ message: "Lỗi server khi xóa category" });
  }
};

module.exports = { createCategory, getAllCategories, deleteCategoryById };