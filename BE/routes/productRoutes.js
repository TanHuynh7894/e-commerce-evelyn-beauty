const express = require("express");
const router = express.Router();
const productsController = require("../controllers/products.controllers");
const {
  validateSearchKeyword,
  paginate,
  logProductRequest,
} = require("../middlewares/products.middlewares");
const { verifyToken, requireRole } = require("../middlewares/auth");

//Lấy tất cả sản phẩm
router.get("/", logProductRequest, paginate, productsController.getAllProducts);

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

//Láy list 10 sản phẩm recommend
router.get("/recommend", paginate, productsController.getRecommendProducts);

//importNewProduct
router.post(
  "/importProduct",
  verifyToken,
  requireRole("SF", "OS"),
  productsController.importNewProduct
);

//updateProduct
router.patch(
  "/updateProduct",
  verifyToken,
  requireRole("SF", "OS"),
  productsController.updateProduct
);

// Lấy chi tiết sản phẩm, category, classification, rating stats
router.get("/:productId/detail", productsController.getProductDetail);

module.exports = router;
