const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const session = require("express-session");
const passport = require("./auth/passport");
const productsRoutes = require("./routes/productRoutes");
//  Import route đã tích hợp tất cả (login, register, forgot/reset password, OTP, Google, protected)
const authRoutes = require("./routes/accountRoutes");
const profileRoutes = require("./routes/profileRoutes");
const cartRoutes = require("./routes/cartRoutes");
const cartItemRoutes = require("./routes/cartItemRoutes");
const supportRoutes = require("./routes/supportRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const categoryForProductRoutes = require("./routes/categoryForProductRoutes");
const promotionProgramsRoutes = require("./routes/promotionProgramsRoutes");
const classificationRoutes = require("./routes/classificationRoutes");
const classificationForProductRoutes = require("./routes/classificationForProductRoutes");
const orderRoutes = require("./routes/orderRoutes");
const orderDetailRoutes = require("./routes/orderDetailRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Session setup (cho Google OAuth nếu dùng)
app.use(
  session({
    secret: "super-secret",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// 🏠 Route kiểm tra server
app.get("/", (req, res) => {
  res.send(" Server Evelyn Beauty hoạt động! Vào /auth để dùng API.");
});

//  Mount tất cả route vào /auth
app.use("/auth", authRoutes); // Bao gồm login, register, forgot-password, reset-password, OTP, Google, và cả protected

app.use("/api/protected", authRoutes);
//Route cho products
app.use("/api/products", productsRoutes);

//Route cho profiles
app.use("/api/profiles", profileRoutes);

//Route cho accounts
app.use("/api/accounts", authRoutes);
//Route cho cart
app.use("/api/carts", cartRoutes);

//Route cho CartItem
app.use("/api/cart-items", cartItemRoutes);

//Route cho Support
app.use("/api/supports", supportRoutes);

//Route cho categories
app.use("/api/categories", categoryRoutes);

//Route cho categoryForProduct
app.use("/api/category-for-product", categoryForProductRoutes);

//Route cho promotion programs
app.use("/api/promotion-programs", promotionProgramsRoutes);

//Route cho classifications
app.use("/api/classifications", classificationRoutes);

//Route cho classificationForProduct
app.use("/api/classification-for-product", classificationForProductRoutes);

//Route cho orders
app.use("/api/orders", orderRoutes);

//Route cho orderDetail
app.use("/api/order-details", orderDetailRoutes);

//Route cho delivery
app.use("/api/delivery", deliveryRoutes);

//Route cho checkout
app.use("/api/checkout", checkoutRoutes);

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` Backend đang chạy tại http://localhost:${PORT}`);
});
