const { ClassificationProduct, Classification, Product } = require("../models");

// Lấy tất cả classification-product
const getAllClassificationProducts = async (req, res) => {
  try {
    const data = await ClassificationProduct.findAll({
      include: [
        { model: Classification, as: "classification" },
        { model: Product, as: "product" },
      ],
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
};

// Thêm classification-product (kiểm tra classificationId và productId phải tồn tại)
const addClassificationProduct = async (req, res) => {
  try {
    const { classificationId, productId, quantity } = req.body;
    if (!classificationId || !productId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu classificationId hoặc productId",
      });
    }
    // Kiểm tra classificationId tồn tại
    const classification = await Classification.findOne({
      where: { classificationId },
    });
    if (!classification) {
      return res
        .status(404)
        .json({ success: false, message: "classificationId không tồn tại" });
    }
    // Kiểm tra productId tồn tại
    const product = await Product.findOne({ where: { productId } });
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "productId không tồn tại" });
    }
    // Kiểm tra trùng
    const exist = await ClassificationProduct.findOne({
      where: { classificationId, productId },
    });
    if (exist) {
      return res
        .status(400)
        .json({ success: false, message: "Đã tồn tại liên kết này" });
    }
    const newItem = await ClassificationProduct.create({
      classificationId,
      productId,
      quantity,
    });
    res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
};

// Cập nhật quantity cho classification-product
const updateClassificationProduct = async (req, res) => {
  try {
    // Loại bỏ khoảng trắng thừa
    let { classificationId, productId, quantity } = req.body;
    if (typeof classificationId === "string")
      classificationId = classificationId.trim();
    if (typeof productId === "string") productId = productId.trim();
    // Nếu quantity là string thì thử chuyển sang số
    if (typeof quantity === "string") {
      // Chặn trường hợp nhập chữ hoặc ký tự đặc biệt
      if (!/^-?\d+$/.test(quantity.trim())) {
        return res.status(400).json({
          success: false,
          message: "Quantity phải là số nguyên không âm",
        });
      }
      quantity = Number(quantity);
    }
    if (!classificationId || !productId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu classificationId hoặc productId",
      });
    }
    // Chặn quantity không phải số nguyên không âm
    if (
      typeof quantity !== "number" ||
      isNaN(quantity) ||
      quantity < 0 ||
      !Number.isInteger(quantity)
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity phải là số nguyên không âm",
      });
    }
    // Kiểm tra liên kết tồn tại
    const item = await ClassificationProduct.findOne({
      where: { classificationId, productId },
    });
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy liên kết để cập nhật",
      });
    }
    await item.update({ quantity });
    res
      .status(200)
      .json({ success: true, message: "Cập nhật thành công", data: item });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
};

module.exports = {
  getAllClassificationProducts,
  addClassificationProduct,
  updateClassificationProduct,
};
