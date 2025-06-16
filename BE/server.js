const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const passport = require('./auth/passport'); // đường dẫn đến file cấu hình passport
const authRoutes = require('./routes/auth');
const googleRoutes = require('./routes/google');
const protectedRoutes = require('./routes/protectedRoutes'); 
const productRoutes = require('./routes/topSeller');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔐 Cấu hình session (bắt buộc cho passport)
app.use(session({
  secret: 'super-secret', // bạn có thể thay bằng chuỗi mạnh hơn
  resave: false,
  saveUninitialized: true
}));

// 🔐 Khởi tạo passport middleware
app.use(passport.initialize());
app.use(passport.session());

// 👇 Route mặc định
app.get('/', (req, res) => {
  res.send('✅ Server Evelyn Beauty hoạt động! Vào /auth để dùng API.');
});

// 👇 Route chính cho Đăng nhập truyền thống
app.use('/auth', authRoutes);

// 👇 Route cho Google OAuth
app.use('/auth', googleRoutes);

// ✅ Route cần Bearer Token để truy cập
app.use('/api/protected', protectedRoutes);

//Route cho topSeller ở homePage
app.use('/api', productRoutes);

// 👂 Lắng nghe cổng từ .env hoặc mặc định 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend đang chạy tại http://localhost:${PORT}`);
});
