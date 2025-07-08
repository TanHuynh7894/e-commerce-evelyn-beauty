const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const session = require("express-session");
const passport = require("./auth/passport");

// const productsRoutes = require("./routes/productRoutes");
//  Import route đã tích hợp tất cả (login, register, forgot/reset password, OTP, Google, protected)
const authRoutes = require("./routes/accountRoutes");
// const paymentRoutes = require("./routes/paymentRoutes");
// const profileRoutes = require("./routes/profileRoutes");
// const orderRoutes = require("./routes/orderRoutes");
// const promotionProgramRoutes = require("./routes/promotionProgramRoutes");


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// app.use("/api/protected", authRoutes);
// //Route cho products
// app.use("/api/products", productsRoutes);

// //Route cho profiles
// app.use("/api/profiles", profileRoutes);

// //Route cho promotion programs
// app.use("/api/promotion-programs", promotionProgramRoutes);

//Route cho accounts
app.use("/api/accounts", authRoutes);

//Route cho orders
// app.use("/api/orders", orderRoutes);
// //Route cho payment
// app.use("/api/payment", paymentRoutes);
// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` Backend đang chạy tại http://localhost:${PORT}`);
});