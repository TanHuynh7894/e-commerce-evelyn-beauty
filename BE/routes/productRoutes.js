const express = require("express");
const router = express.Router();
const productsController = require("../controllers/products.controllers");
const {
  validateSearchKeyword,
  paginate,
  logProductRequest,
} = require("../middlewares/products.middlewares");
const { verifyToken, requireRole } = require("../middlewares/auth");
// Multer config cho product images (nếu chưa có ở đầu file thì thêm vào)
const multer = require("multer");
const path = require("path");
const productStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/products")); // Lưu vào public/products
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "product_" + uniqueSuffix + path.extname(file.originalname));
  },
});
const uploadProduct = multer({ storage: productStorage });

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

// Sửa route importProduct để hỗ trợ upload nhiều file ảnh
router.post(
  "/importProduct",
  uploadProduct.array("images", 5), // nhận tối đa 5 file ảnh, trường images
  verifyToken,
  requireRole("SF", "OS"),
  productsController.importNewProduct
);

//updateProduct
router.put(
  "/updateProduct",
  uploadProduct.array("images", 5), // Thêm middleware upload file ảnh
  verifyToken,
  requireRole("SF", "OS"),
  productsController.updateProduct
);

// Lấy chi tiết sản phẩm, category, classification, rating stats
router.get("/:productId/detail", productsController.getProductDetail);

// Xóa sản phẩm (chuyển trạng thái thành OFF)
router.delete(
  "/deleteProduct",
  verifyToken,
  requireRole( "OS"),
  productsController.deleteProduct
);


module.exports = router;
