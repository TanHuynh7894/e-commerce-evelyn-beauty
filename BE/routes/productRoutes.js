const express = require("express");
const router = express.Router();
const productsController = require("../controllers/products.controllers");
const {
  validateSearchKeyword,
  paginate,
  logProductRequest,
} = require("../middlewares/products.middlewares");

//Lấy tất cả sản phẩm
router.get("/", logProductRequest, productsController.getAllProducts);

// Lấy sản phẩm theo categoryId
router.get("/category", paginate, productsController.getProductsByCategory);

// Lấy sản phẩm theo brand
router.get("/brand", paginate, productsController.getProductsByBrand);

// Lấy sản phẩm theo categoryId và brand
router.get(
  "/category",
  paginate,
  productsController.getProductsByCategoryAndBrand
);

// Tìm kiếm sản phẩm
router.get("/search", validateSearchKeyword, productsController.searchProducts);

module.exports = router;
