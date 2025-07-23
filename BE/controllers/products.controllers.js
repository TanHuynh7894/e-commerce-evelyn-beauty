const {
  Product,
  Category,
  OrderDetail,
  Order,
  CategoryProduct,
  ClassificationProduct,
  Classification,
} = require("../models");
const { Op, Sequelize } = require("sequelize");
const fs = require("fs");
const path = require("path");

// Lấy tất cả sản phẩm
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { status: "ON" },
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
        [
          Sequelize.literal(`(
          SELECT COALESCE(SUM(quantity), 0)
          FROM classification_for_product
          WHERE classification_for_product.product_id = Product.product_id
        )`),
          "quantity",
        ],
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
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  try {
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy danh mục", categoryId });
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where: { status: "ON" },
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
        [
          Sequelize.literal(`(
          SELECT COALESCE(SUM(quantity), 0)
          FROM classification_for_product
          WHERE classification_for_product.product_id = Product.product_id
        )`),
          "quantity",
        ],
      ],
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

    // Biến images thành mảng như getAllProducts
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

    res.json({
      message: "Lấy sản phẩm theo danh mục thành công",
      data: {
        products: data,
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
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  try {
    const { count, rows: products } = await Product.findAndCountAll({
      where: { brand, status: "ON" },
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
        [
          Sequelize.literal(`(
          SELECT COALESCE(SUM(quantity), 0)
          FROM classification_for_product
          WHERE classification_for_product.product_id = Product.product_id
        )`),
          "quantity",
        ],
      ],
      limit,
      offset,
      order: [["price", "DESC"]],
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
    res.json({
      message: "Lấy sản phẩm theo brand thành công",
      data: {
        products: data,
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
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  try {
    const categoryId = category;
    const categoryObj = await Category.findByPk(categoryId);
    if (!categoryObj) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy danh mục", categoryId });
    }
    const productIds = await CategoryProduct.findAll({
      where: { categoryId },
      attributes: ["productId"],
    });
    const ids = productIds.map((item) => item.productId);
    const { count, rows: products } = await Product.findAndCountAll({
      where: { productId: ids, brand, status: "ON" },
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
        [
          Sequelize.literal(`(
          SELECT COALESCE(SUM(quantity), 0)
          FROM classification_for_product
          WHERE classification_for_product.product_id = Product.product_id
        )`),
          "quantity",
        ],
      ],
      limit,
      offset,
      order: [["price", "DESC"]],
    });
    // Biến images thành mảng như getAllProducts
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
    res.json({
      message: "Lấy sản phẩm theo danh mục và brand thành công",
      data: {
        products: data,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy sản phẩm theo danh mục và brand:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy sản phẩm theo danh mục và brand",
      error: error.message,
    });
  }
};

//dynamic search
exports.searchProducts = async (req, res) => {
  try {
    const { keyword } = req.query;
    const products = await Product.findAll({
      where: {
        name: {
          [Op.like]: `%${keyword}%`,
        },
        status: "ON",
      },
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
        [
          Sequelize.literal(`(
          SELECT COALESCE(SUM(quantity), 0)
          FROM classification_for_product
          WHERE classification_for_product.product_id = Product.product_id
        )`),
          "quantity",
        ],
      ],
      limit: 20,
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
    res.json({
      message: "Tìm kiếm sản phẩm thành công",
      query: req.query,
      data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server khi tìm kiếm sản phẩm",
      error: error.message,
    });
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
    // Lấy tất cả orderDetail có rate và order status = done
    const products = await OrderDetail.findAll({
      attributes: ["productId", "quantity", "rate"],
      include: [
        {
          model: Product,
          as: "product",
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
            [
              Sequelize.literal(`(
              SELECT COALESCE(SUM(quantity), 0)
              FROM classification_for_product
              WHERE classification_for_product.product_id = product.product_id
            )`),
              "quantity",
            ],
          ],
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
      const prod = item.product;
      if (!prod) continue;
      // Lọc: chỉ lấy đơn hoàn thành và có đánh giá
      if (status !== "done" || rate == null) continue;
      if (!productMap[productId]) {
        productMap[productId] = {
          ...prod.get({ plain: true }),
          quantitySold: quantity || 0,
          totalRate: rate,
          countRate: 1,
        };
      } else {
        productMap[productId].quantitySold += quantity || 0;
        productMap[productId].totalRate += rate;
        productMap[productId].countRate += 1;
      }
    }

    const result = Object.values(productMap)
      .map((prod) => {
        const averageRate = parseFloat(
          (prod.totalRate / prod.countRate).toFixed(2)
        );
        // Xử lý images array
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
        return {
          productId: prod.productId,
          name: prod.name,
          origin: prod.origin,
          brand: prod.brand,
          price: prod.price,
          description: prod.description,
          images: prod.images,
          quantity: prod.quantity, // tổng tồn kho
          quantitySold: prod.quantitySold, // tổng đã bán
          averageRate,
          countRate: prod.countRate,
        };
      })
      .filter((p) => p.averageRate >= 4.5)
      .sort((a, b) => b.averageRate - a.averageRate)
      .slice(0, 10);

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
    let { products } = req.body;
    // Nếu products là string (gửi qua form-data), parse lại JSON
    if (typeof products === "string") {
      try {
        products = JSON.parse(products);
      } catch (e) {
        return res
          .status(400)
          .json({ message: "products không phải là JSON hợp lệ." });
      }
    }
    if (!Array.isArray(products) || products.length === 0) {
      return res
        .status(400)
        .json({ message: "Danh sách sản phẩm không hợp lệ hoặc rỗng." });
    }

    const created = [];
    const skipped = [];

    for (const [index, item] of products.entries()) {
      const {
        name,
        origin,
        brand,
        price,
        description,
        images = [], // mảng link ảnh
        categories = [], // mảng categoryId
        classifications = [], // mảng { classificationId, quantity }
      } = item;
      const accountId = req.user.accountId; // lấy từ user đăng nhập

      if (!name || !price || !brand) {
        skipped.push({ name, reason: "Thiếu thông tin bắt buộc" });
        continue;
      }

      // Kiểm tra thiếu categoryId
      if (Array.isArray(categories) && categories.length > 0) {
        const invalidCategory = categories.find(
          (catId) => !catId && catId !== 0
        );
        if (invalidCategory !== undefined) {
          skipped.push({ name, reason: "Thiếu categoryId trong categories" });
          continue;
        }
      }

      // Kiểm tra thiếu classificationId
      if (Array.isArray(classifications) && classifications.length > 0) {
        const invalidClassification = classifications.find(
          (cl) => !cl.classificationId && cl.classificationId !== 0
        );
        if (invalidClassification !== undefined) {
          skipped.push({
            name,
            reason: "Thiếu classificationId trong classifications",
          });
          continue;
        }
      }

      const newProductId = "PD" + Date.now() + Math.floor(Math.random() * 1000);

      // Kiểm tra sản phẩm đã tồn tại (KHÔNG kiểm tra image)
      const existing = await Product.findOne({
        where: { name, origin, brand, price, description },
      });

      if (existing) {
        skipped.push({ name, reason: "Sản phẩm đã tồn tại" });
        continue;
      }

      // Ưu tiên lấy ảnh từ file upload nếu có (form-data)
      let imagesArr = images;
      if (req.files && req.files.length > 0) {
        // Nếu gửi nhiều sản phẩm 1 lần, chia đều file cho từng sản phẩm (nâng cao),
        // còn nếu chỉ gửi 1 sản phẩm thì lấy hết file cho sản phẩm đó
        if (products.length === 1) {
          imagesArr = req.files.map((f) => `/public/products/${f.filename}`);
        } else {
          // Nếu gửi nhiều sản phẩm, mỗi sản phẩm gửi kèm số file ảnh tương ứng
          // (ví dụ: req.files = [file1, file2, file3, ...], mỗi item.images.length)
          // Ở đây chỉ lấy file theo thứ tự cho từng sản phẩm nếu cần
          // Đơn giản: mỗi sản phẩm lấy 1 file theo index (nếu có)
          if (req.files[index]) {
            imagesArr = [`/public/products/${req.files[index].filename}`];
          }
        }
      }
      const [image_1, image_2, image_3, image_4, image_5] = imagesArr;

      // Tạo sản phẩm mới (KHÔNG có quantity)
      const newProduct = await Product.create({
        productId: newProductId,
        name,
        origin,
        brand,
        price,
        description,
        image_1,
        image_2,
        image_3,
        image_4,
        image_5,
        accountId, // truyền accountId lấy từ user đăng nhập
      });

      // Gán category cho sản phẩm (nếu có)
      if (Array.isArray(categories) && categories.length > 0) {
        for (const categoryId of categories) {
          await CategoryProduct.create({
            categoryId,
            productId: newProductId,
          });
        }
      }

      // Gán classification và quantity cho từng classification (nếu có)
      if (Array.isArray(classifications) && classifications.length > 0) {
        for (const cl of classifications) {
          await ClassificationProduct.create({
            productId: newProductId,
            classificationId: cl.classificationId,
            quantity: cl.quantity || 0,
          });
        }
      }

      created.push(newProduct);
    }

    if (created.length === 0) {
      return res.status(400).json({
        message: "Import không thành công",
        imported: 0,
        skipped: skipped.length,
        data: {
          created: [],
          skipped,
        },
      });
    }

    return res.status(201).json({
      message: "Import sản phẩm thành công",
      imported: created.length,
      skipped: skipped.length,
      data: {
        created: created.map((prod) => {
          const p = prod.get ? prod.get({ plain: true }) : prod;
          p.images = [
            p.image_1,
            p.image_2,
            p.image_3,
            p.image_4,
            p.image_5,
          ].filter(Boolean);
          delete p.image_1;
          delete p.image_2;
          delete p.image_3;
          delete p.image_4;
          delete p.image_5;
          return p;
        }),
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
    const updates = req.body || {};

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

    if (updateKeys.length === 0 && (!req.files || req.files.length === 0)) {
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
    const accountId = req.user.accountId; // lấy từ user đăng nhập

    // Xử lý ảnh khi update bằng form-data
    let image_1 = updates.image_1 || product.image_1;
    let image_2 = updates.image_2 || product.image_2;
    let image_3 = updates.image_3 || product.image_3;
    let image_4 = updates.image_4 || product.image_4;
    let image_5 = updates.image_5 || product.image_5;

    // Nếu có file upload mới, xóa ảnh cũ trong public/products và lưu ảnh mới vào đó
    if (req.files && req.files.length > 0) {
      // Danh sách ảnh cũ
      const oldImages = [
        product.image_1,
        product.image_2,
        product.image_3,
        product.image_4,
        product.image_5,
      ];
      for (const img of oldImages) {
        if (img && img.startsWith("/public/products/")) {
          const imgPath = path.join(__dirname, "..", img);
          fs.unlink(imgPath, (err) => {
            // Không cần throw nếu lỗi file không tồn tại
          });
        }
      }
      // Lưu file mới vào public/products và cập nhật đường dẫn
      const filePaths = req.files.map((f) => `/public/products/${f.filename}`);
      [image_1, image_2, image_3, image_4, image_5] = filePaths;
    }

    const newProduct = await Product.create({
      productId: newProductId,
      name: updates.name || product.name,
      origin: updates.origin || product.origin,
      brand: updates.brand || product.brand,
      price: updates.price || product.price,
      description: updates.description || product.description,
      image_1,
      image_2,
      image_3,
      image_4,
      image_5,
      accountId, // truyền accountId lấy từ user đăng nhập
      status: "ON",
    });

    // Gán lại category cũ cho product mới
    const oldCategories = await CategoryProduct.findAll({
      where: { productId },
    });
    for (const cat of oldCategories) {
      await CategoryProduct.create({
        categoryId: cat.categoryId,
        productId: newProductId,
      });
    }
    // Gán lại classification cũ cho product mới
    const oldClassifications = await ClassificationProduct.findAll({
      where: { productId },
    });
    for (const cl of oldClassifications) {
      await ClassificationProduct.create({
        productId: newProductId,
        classificationId: cl.classificationId,
        quantity: cl.quantity,
      });
    }

    return res.status(200).json({
      message: "Đã tạo sản phẩm mới và update status sản phẩm cũ thành off.",
      newProduct: (() => {
        const p = newProduct.get ? newProduct.get({ plain: true }) : newProduct;
        p.images = [
          p.image_1,
          p.image_2,
          p.image_3,
          p.image_4,
          p.image_5,
        ].filter(Boolean);
        delete p.image_1;
        delete p.image_2;
        delete p.image_3;
        delete p.image_4;
        delete p.image_5;
        return p;
      })(),
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
        {
          model: Classification,
          as: "classification",
          attributes: ["name"],
        },
      ],
    });
    // Log classificationId của sản phẩm được chọn
    const classificationIds = classificationLinks.map(
      (link) => link.classificationId
    );
    console.log(
      "classificationIds for product",
      productId,
      ":",
      classificationIds
    );
    const classifications = classificationLinks
      .filter((link) => link.classification && link.classification.name)
      .map((link) => ({
        classificationId: link.classificationId,
        name: link.classification.name,
        quantity: link.quantity,
      }));

    // Lấy thống kê rating từ orderDetail
    const orderDetails = await OrderDetail.findAll({
      where: { productId },
      attributes: ["rate"],
    });
    // Đếm số lượt đánh giá 5,4,3,2,1
    const ratingStars = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let total = 0;
    let sum = 0;
    orderDetails.forEach((od) => {
      const r = od.rate;
      if (r && ratingStars[r] !== undefined) {
        ratingStars[r]++;
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
        ratingStars,
        averageRating,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
};
