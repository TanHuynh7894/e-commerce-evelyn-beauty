const { Product, Category, OrderDetail, Order } = require("../models");
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
  const categoryId = req.query.category;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy danh mục", categoryId });
    }

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
  const { category, brand } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    // Kiểm tra category có tồn tại không
    const categoryExists = await Category.findByPk(category);
    if (!categoryExists) {
      return res.status(404).json({
        message: "Không tìm thấy danh mục sản phẩm",
        category,
      });
    }

    // Lấy sản phẩm với phân trang và lọc theo cả category và brand
    const { count, rows: products } = await Product.findAndCountAll({
      include: [
        {
          model: Category,
          as: "categories",
          where: { categoryId: category },
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

/*
  Lấy sản phẩm recommend:
  1. status = done
  2. rate != null
  3. trung bình rate của tất cả >= 4.5
  4. trả về 10 sản phẩm
*/ 

 exports.getRecommendProducts = async (req, res) => {
  try {
    const products = await OrderDetail.findAll({
      attributes: ['productId', 'quantity', 'rate'],
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['image', 'name']
        },
        {
          model: Order,
          as: 'order',
          attributes: ['status']
        }
      ]
    });

    const productMap = {};

    for (const item of products) {
      const { productId, quantity, rate } = item;
      const status = item.order?.status;
      const name = item.product?.name || 'Unknown';
      const image = item.product?.image || null;

      // ✅ Lọc: chỉ lấy đơn hoàn thành và có đánh giá
      if (status !== 'done' || rate == null) continue;

      if (!productMap[productId]) {
        productMap[productId] = {
          name,
          image,
          quantity: quantity || 0,
          totalRate: rate,
          countRate: 1
        };
      } else {
        productMap[productId].quantity += quantity || 0;
        productMap[productId].totalRate += rate;
        productMap[productId].countRate += 1;
      }
    }

    const result = Object.entries(productMap)
      .map(([productId, data]) => {
        const averageRate = parseFloat((data.totalRate / data.countRate).toFixed(2));
        return {
          productId,
          name: data.name,
          image: data.image,
          quantitySold: data.quantity,
          averageRate,
          countRate: data.countRate
        };
      })
      .filter(p => p.averageRate > 4.5)
      .sort((a, b) => b.averageRate - a.averageRate) // 🔁 hoặc sort theo quantitySold nếu muốn
      .slice(0, 10); // 🔟 Top 10 sản phẩm

    return res.status(200).json({
      message: 'Lấy sản phẩm đề xuất thành công',
      data: result
    });

  } catch (error) {
    console.error('Error fetching recommended products:', error);
    return res.status(500).json({
      message: 'Lỗi server khi lấy sản phẩm đề xuất',
      error: error.message
    });
  }
};