const { Product, Category } = require("../models");
const { Op } = require("sequelize");
// Lấy tất cả sản phẩm
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi lấy sản phẩm", error });
  }
};

// Lấy sản phẩm theo categoryId (many-to-many)
exports.getProductsByCategory = async (req, res) => {
  const { categoryId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    // Kiểm tra category có tồn tại không
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({
        message: "Không tìm thấy danh mục sản phẩm",
        categoryId,
      });
    }

    // Lấy sản phẩm với phân trang
    const { count, rows: products } = await Product.findAndCountAll({
      include: [
        {
          model: Category,
          as: "categories",
          where: { categoryId },
          attributes: ["categoryId", "name"],
        },
      ],
      limit,
      offset,
      order: [["price", "DESC"]],
    });

    res.json({
      message: "Lấy sản phẩm theo danh mục thành công",
      data: {
        products,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy sản phẩm theo category:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy sản phẩm theo danh mục",
      error: error.message,
    });
  }
};

// Lấy sản phẩm theo brand
exports.getProductsByBrand = async (req, res) => {
  const { brand } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    // Lấy sản phẩm với phân trang và lọc theo brand
    const { count, rows: products } = await Product.findAndCountAll({
      where: { brand },
      limit,
      offset,
      order: [["productId", "DESC"]],
    });

    res.json({
      message: "Lấy sản phẩm theo thương hiệu thành công",
      data: {
        products,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy sản phẩm theo brand:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy sản phẩm theo thương hiệu",
      error: error.message,
    });
  }
};

// Lấy sản phẩm theo categoryId và brand
exports.getProductsByCategoryAndBrand = async (req, res) => {
  const { categoryId } = req.params;
  const { brand } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    // Kiểm tra category có tồn tại không
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({
        message: "Không tìm thấy danh mục sản phẩm",
        categoryId,
      });
    }

    // Lấy sản phẩm với phân trang và lọc theo cả category và brand
    const { count, rows: products } = await Product.findAndCountAll({
      include: [
        {
          model: Category,
          as: "categories",
          where: { categoryId },
          attributes: ["categoryId", "name"],
        },
      ],
      where: brand ? { brand } : {},
      limit,
      offset,
      order: [["productId", "DESC"]],
    });

    res.json({
      message: "Lấy sản phẩm theo danh mục và thương hiệu thành công",
      data: {
        products,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy sản phẩm theo category và brand:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy sản phẩm theo danh mục và thương hiệu",
      error: error.message,
    });
  }
};
exports.searchProducts = async (req, res) => {
  try {
    const keyword = req.query.keyword;
    const products = await Product.findAll({
      where: {
        name: {
          [Op.like]: `%${keyword}%`,
        },
      },
      limit: 20,
    });
    res.json(products);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi server khi tìm kiếm sản phẩm", error });
  }
};
