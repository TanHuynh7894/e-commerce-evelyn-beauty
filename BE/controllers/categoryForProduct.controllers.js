const { CategoryProduct } = require("../models");
const Category = require("../models/category");
const Product = require("../models/product");

// Lấy tất cả các categoryForProduct
exports.logAllCategoryForProduct = async (req, res) => {
  try {
    const allCategoryForProduct = await CategoryProduct.findAll();
    console.log("Tất cả categoryForProduct:", allCategoryForProduct);
    res.status(200).json({
      message: "Lấy tất cả categoryForProduct thành công",
      data: allCategoryForProduct,
    });
  } catch (error) {
    console.error("Lỗi khi lấy categoryForProduct:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy categoryForProduct",
      error: error.message,
    });
  }
};

// Tạo một categoryForProduct mới
exports.createCategoryForProduct = async (req, res) => {
  try {
    const { categoryId, productId } = req.body;
    if (!categoryId || !productId) {
      return res.status(400).json({
        message: "Thiếu categoryId hoặc productId",
      });
    }
    // Kiểm tra categoryId tồn tại
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(400).json({
        message: `categoryId '${categoryId}' không tồn tại trong hệ thống!`,
      });
    }
    // Kiểm tra productId tồn tại
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(400).json({
        message: `productId '${productId}' không tồn tại trong hệ thống!`,
      });
    }
    const newCategoryForProduct = await CategoryProduct.create({
      categoryId,
      productId,
    });
    res.status(201).json({
      message: "Tạo categoryForProduct thành công",
      data: newCategoryForProduct,
    });
  } catch (error) {
    console.error("Lỗi khi tạo categoryForProduct:", error);
    res.status(500).json({
      message: "Lỗi server khi tạo categoryForProduct",
      error: error.message,
    });
  }
};

// Xóa một categoryForProduct
exports.deleteCategoryForProduct = async (req, res) => {
  try {
    const { categoryId, productId } = req.body;
    if (!categoryId || !productId) {
      return res.status(400).json({
        message: "Thiếu categoryId hoặc productId",
      });
    }
    const deleted = await CategoryProduct.destroy({
      where: { categoryId, productId },
    });
    if (deleted === 0) {
      return res.status(404).json({
        message: "Không tìm thấy categoryForProduct để xóa",
      });
    }
    res.status(200).json({
      message: "Xóa categoryForProduct thành công",
    });
  } catch (error) {
    console.error("Lỗi khi xóa categoryForProduct:", error);
    res.status(500).json({
      message: "Lỗi server khi xóa categoryForProduct",
      error: error.message,
    });
  }
};

// Cập nhật categoryForProduct
exports.updateCategoryForProduct = async (req, res) => {
  try {
    const { oldCategoryId, oldProductId, newCategoryId, newProductId } =
      req.body;
    if (!oldCategoryId || !oldProductId || !newCategoryId || !newProductId) {
      return res.status(400).json({
        message:
          "Thiếu thông tin cập nhật (oldCategoryId, oldProductId, newCategoryId, newProductId)",
      });
    }
    // Kiểm tra categoryId và productId mới có tồn tại không
    const category = await Category.findByPk(newCategoryId);
    if (!category) {
      return res.status(400).json({
        message: `categoryId '${newCategoryId}' không tồn tại trong hệ thống!`,
      });
    }
    const product = await Product.findByPk(newProductId);
    if (!product) {
      return res.status(400).json({
        message: `productId '${newProductId}' không tồn tại trong hệ thống!`,
      });
    }
    // Tìm bản ghi cũ
    const categoryForProduct = await CategoryProduct.findOne({
      where: { categoryId: oldCategoryId, productId: oldProductId },
    });
    if (!categoryForProduct) {
      return res.status(404).json({
        message: "Không tìm thấy categoryForProduct để cập nhật",
      });
    }
    // Cập nhật (xóa bản ghi cũ, tạo bản ghi mới)
    await CategoryProduct.destroy({
      where: { categoryId: oldCategoryId, productId: oldProductId },
    });
    const updated = await CategoryProduct.create({
      categoryId: newCategoryId,
      productId: newProductId,
    });
    res.status(200).json({
      message: "Cập nhật categoryForProduct thành công",
      data: updated,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật categoryForProduct:", error);
    res.status(500).json({
      message: "Lỗi server khi cập nhật categoryForProduct",
      error: error.message,
    });
  }
};