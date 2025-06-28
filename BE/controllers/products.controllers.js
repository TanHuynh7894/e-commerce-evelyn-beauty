const {
  Product,
  Category,
  OrderDetail,
  Order,
  CategoryProduct,
  ClassificationProduct,
  Classification,
} = require("../models");
const { Op } = require("sequelize");

// Lấy tất cả sản phẩm
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      attributes: [
        "productId",
        "name",
        "origin",
        "brand",
        "price",
        "description",
        "image_1",
        "image_2",
        "image_3",
        "image_4",
        "image_5",
      ],
    });
    const data = products.map((p) => {
      const prod = p.get({ plain: true });
      prod.images = [
        prod.image_1,
        prod.image_2,
        prod.image_3,
        prod.image_4,
        prod.image_5,
      ].filter(Boolean);
      delete prod.image_1;
      delete prod.image_2;
      delete prod.image_3;
      delete prod.image_4;
      delete prod.image_5;
      return prod;
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
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

//dynamic search
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
      attributes: ["productId", "quantity", "rate"],
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["image", "name"],
        },
        {
          model: Order,
          as: "order",
          attributes: ["status"],
        },
      ],
    });

    const productMap = {};

    for (const item of products) {
      const { productId, quantity, rate } = item;
      const status = item.order?.status;
      const name = item.product?.name || "Unknown";
      const image = item.product?.image || null;

      // Lọc: chỉ lấy đơn hoàn thành và có đánh giá
      if (status !== "done" || rate == null) continue;

      if (!productMap[productId]) {
        productMap[productId] = {
          name,
          image,
          quantity: quantity || 0,
          totalRate: rate,
          countRate: 1,
        };
      } else {
        productMap[productId].quantity += quantity || 0;
        productMap[productId].totalRate += rate;
        productMap[productId].countRate += 1;
      }
    }

    const result = Object.entries(productMap)
      .map(([productId, data]) => {
        const averageRate = parseFloat(
          (data.totalRate / data.countRate).toFixed(2)
        );
        return {
          productId,
          name: data.name,
          image: data.image,
          quantitySold: data.quantity,
          averageRate,
          countRate: data.countRate,
        };
      })
      .filter((p) => p.averageRate > 4.5)
      .sort((a, b) => b.averageRate - a.averageRate) // hoặc sort theo quantitySold nếu muốn
      .slice(0, 10); // Top 10 sản phẩm

    return res.status(200).json({
      message: "Lấy sản phẩm đề xuất thành công",
      data: result,
    });
  } catch (error) {
    console.error("Error fetching recommended products:", error);
    return res.status(500).json({
      message: "Lỗi server khi lấy sản phẩm đề xuất",
      error: error.message,
    });
  }
};

// thêm 1 sản phẩm mới
exports.importNewProduct = async (req, res) => {
  try {
    console.log("Body nhận được:", JSON.stringify(req.body, null, 2));
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res
        .status(400)
        .json({ message: "Danh sách sản phẩm không hợp lệ hoặc rỗng." });
    }

    const created = [];
    const skipped = [];

    for (const item of products) {
      const {
        name,
        origin,
        quantity,
        brand,
        price,
        description,
        image,
        categoryIds = [],
      } = item;

      if (!name || !price || !brand) {
        skipped.push({ name, reason: "Thiếu thông tin bắt buộc" });
        continue;
      }

      const newProductId = "PD" + Date.now();

      // Kiểm tra sản phẩm đã tồn tại (KHÔNG kiểm tra image)
      const existing = await Product.findOne({
        where: { name, origin, quantity, brand, price, description },
      });

      if (existing) {
        skipped.push({ name, reason: "Sản phẩm đã tồn tại" });
        continue;
      }

      const newProduct = await Product.create({
        productId: newProductId,
        name,
        origin,
        quantity,
        brand,
        price,
        description,
        image,
      });

      // Gán danh mục nếu có
      if (Array.isArray(categoryIds) && categoryIds.length > 0) {
        await newProduct.setCategories(categoryIds); // Sequelize tự map thông qua bảng CategoryProduct
      }

      created.push(newProduct);
    }

    return res.status(201).json({
      message: "Import sản phẩm thành công",
      imported: created.length,
      skipped: skipped.length,
      data: {
        created,
        skipped,
      },
    });
  } catch (error) {
    console.error("Lỗi khi import sản phẩm:", error);
    return res.status(500).json({
      message: "Lỗi server khi import sản phẩm",
      error: error.message,
    });
  }
};

//update thông tin sản phẩm
exports.updateProduct = async (req, res) => {
  try {
    const { productId } = req.query;
    const updates = req.body;

    const product = await Product.findByPk(productId);

    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm." });
    }

    // Danh sách các trường được phép cập nhật
    const allowedFields = [
      "name",
      "origin",
      "quantity",
      "brand",
      "price",
      "description",
      "image",
    ];
    const updateKeys = Object.keys(updates).filter((key) =>
      allowedFields.includes(key)
    );

    if (updateKeys.length === 0) {
      return res
        .status(400)
        .json({ message: "Không có trường hợp lệ để cập nhật." });
    }

    const isOnlyQuantity =
      updateKeys.length === 1 && updateKeys[0] === "quantity";

    //Trường hợp chỉ update quantity
    if (isOnlyQuantity) {
      await product.update({ quantity: updates.quantity });
      return res.status(200).json({
        message: "Cập nhật số lượng thành công.",
        updatedProduct: product,
      });
    }

    //Trường hợp update thông tin khác → đánh dấu "off" và tạo mới
    await product.update({ status: "OFF" });

    const newProductId = "PD" + Date.now();

    const newProduct = await Product.create({
      productId: newProductId,
      name: updates.name || product.name,
      origin: updates.origin || product.origin,
      quantity: updates.quantity || product.quantity,
      brand: updates.brand || product.brand,
      price: updates.price || product.price,
      description: updates.description || product.description,
      image: updates.image || product.image,
      status: "ON",
    });

    return res.status(200).json({
      message: "Đã tạo sản phẩm mới và update status sản phẩm cũ thành off.",
      newProduct,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật sản phẩm:", error);
    return res.status(500).json({
      message: "Lỗi server khi cập nhật sản phẩm",
      error: error.message,
    });
  }
};

// Lấy chi tiết sản phẩm theo productId, kèm category name, classification name, rating stats
exports.getProductDetail = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findOne({
      where: { productId },
      attributes: [
        "productId",
        "name",
        "origin",
        "brand",
        "price",
        "description",
        "image_1",
        "image_2",
        "image_3",
        "image_4",
        "image_5",
      ],
    });
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sản phẩm" });
    }
    // Lấy category name qua bảng trung gian
    const categoryLinks = await CategoryProduct.findAll({
      where: { productId },
      include: [{ model: Category, as: "category", attributes: ["name"] }],
    });
    const categories = categoryLinks
      .map((link) => link.category)
      .filter((cat) => cat && cat.name)
      .map((cat) => ({ name: cat.name }));
    // Lấy classification name qua bảng trung gian
    const classificationLinks = await ClassificationProduct.findAll({
      where: { productId },
      include: [
        { model: Classification, as: "classification", attributes: ["name"] },
      ],
    });
    const classifications = classificationLinks
      .filter((link) => link.classification && link.classification.name)
      .map((link) => ({
        name: link.classification.name,
        quantity: link.quantity,
      }));

    // Lấy thống kê rating từ orderDetail
    const orderDetails = await OrderDetail.findAll({
      where: { productId },
      attributes: ["rate"],
    });
    // Đếm số lượt đánh giá 5,4,3,2,1
    const ratingStats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let total = 0;
    let sum = 0;
    orderDetails.forEach((od) => {
      const r = od.rate;
      if (r && ratingStats[r] !== undefined) {
        ratingStats[r]++;
        total++;
        sum += r;
      }
    });
    const averageRating = total > 0 ? (sum / total).toFixed(2) : null;

    // Chuyển images sang array
    const productData = product.get({ plain: true });
    productData.images = [
      productData.image_1,
      productData.image_2,
      productData.image_3,
      productData.image_4,
      productData.image_5,
    ].filter(Boolean);
    delete productData.image_1;
    delete productData.image_2;
    delete productData.image_3;
    delete productData.image_4;
    delete productData.image_5;

    // Trả về kết quả
    res.status(200).json({
      success: true,
      data: {
        ...productData,
        categories,
        classifications,
        ratingStats,
        averageRating,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
};
