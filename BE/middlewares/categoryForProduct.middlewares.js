// Middleware log request liên quan đến categoryForProduct
const logCategoryForProductRequest = (req, res, next) => {
  console.log(
    `[CategoryForProduct Middleware] ${req.method} ${req.originalUrl}`
  );
  next();
};

module.exports = {
  logCategoryForProductRequest,
};
