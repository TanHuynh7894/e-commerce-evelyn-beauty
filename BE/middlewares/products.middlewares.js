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

module.exports = {
  validateSearchKeyword,
  paginate,
  logProductRequest,
};
