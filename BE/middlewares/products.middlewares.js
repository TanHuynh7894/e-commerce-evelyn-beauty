// products.middlewares.js

// Middleware kiểm tra keyword trong query khi tìm kiếm sản phẩm
const validateSearchKeyword = (req, res, next) => {
  const keyword = req.query.keyword;
  if (!keyword || keyword.trim().length === 0) {
    return res.status(400).json({ message: "Vui lòng nhập từ khóa tìm kiếm" });
  }
  next();
};

// Middleware phân trang cho sản phẩm
const paginate = (req, res, next) => {
  req.pagination = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    offset: 0,
  };
  req.pagination.offset = (req.pagination.page - 1) * req.pagination.limit;
  next();
};

// Middleware log sản phẩm (debug)
const logProductRequest = (req, res, next) => {
  console.log(`[Product Middleware] ${req.method} ${req.originalUrl}`);
  next();
};

// Middleware validate dữ liệu sản phẩm khi tạo/cập nhật
const validateProductData = (req, res, next) => {
  const { name, price, brand, image } = req.body;

  // Kiểm tra các trường bắt buộc
  if (!name || name.trim().length === 0) {
    return res
      .status(400)
      .json({ message: "Tên sản phẩm không được để trống" });
  }

  if (!price || price <= 0) {
    return res.status(400).json({ message: "Giá sản phẩm phải lớn hơn 0" });
  }

  if (!brand || brand.trim().length === 0) {
    return res.status(400).json({ message: "Thương hiệu không được để trống" });
  }

  // Validate image (có thể là string hoặc array)
  if (image !== undefined) {
    if (Array.isArray(image)) {
      // Nếu là array, kiểm tra từng URL
      for (let i = 0; i < image.length; i++) {
        if (typeof image[i] !== "string" || image[i].trim().length === 0) {
          return res.status(400).json({
            message: `URL hình ảnh thứ ${i + 1} không hợp lệ`,
          });
        }
      }
    } else if (typeof image !== "string" || image.trim().length === 0) {
      return res.status(400).json({ message: "URL hình ảnh không hợp lệ" });
    }
  }

  next();
};

// Middleware sanitize dữ liệu sản phẩm
const sanitizeProductData = (req, res, next) => {
  const { name, origin, brand, description, image } = req.body;

  // Sanitize các trường text
  if (name) req.body.name = name.trim();
  if (origin) req.body.origin = origin.trim();
  if (brand) req.body.brand = brand.trim();
  if (description) req.body.description = description.trim();

  // Sanitize image URLs
  if (image) {
    if (Array.isArray(image)) {
      req.body.image = image
        .map((url) => url.trim())
        .filter((url) => url.length > 0);
    } else if (typeof image === "string") {
      req.body.image = image.trim();
    }
  }

  next();
};

// Middleware validate dữ liệu import sản phẩm
const validateImportData = (req, res, next) => {
  const { products } = req.body;

  if (!Array.isArray(products)) {
    return res.status(400).json({ message: "Dữ liệu sản phẩm phải là array" });
  }

  if (products.length === 0) {
    return res
      .status(400)
      .json({ message: "Danh sách sản phẩm không được rỗng" });
  }

  if (products.length > 100) {
    return res
      .status(400)
      .json({ message: "Chỉ được import tối đa 100 sản phẩm một lần" });
  }

  // Validate từng sản phẩm
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    if (!product.name || product.name.trim().length === 0) {
      return res.status(400).json({
        message: `Sản phẩm thứ ${i + 1}: Tên sản phẩm không được để trống`,
      });
    }
    if (!product.price || product.price <= 0) {
      return res.status(400).json({
        message: `Sản phẩm thứ ${i + 1}: Giá sản phẩm phải lớn hơn 0`,
      });
    }
    if (!product.brand || product.brand.trim().length === 0) {
      return res.status(400).json({
        message: `Sản phẩm thứ ${i + 1}: Thương hiệu không được để trống`,
      });
    }
  }

  next();
};

module.exports = {
  validateSearchKeyword,
  paginate,
  logProductRequest,
  validateProductData,
  sanitizeProductData,
  validateImportData,
};
