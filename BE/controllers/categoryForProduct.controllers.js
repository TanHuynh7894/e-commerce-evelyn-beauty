const { CategoryProduct } = require("../models");

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
