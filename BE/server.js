const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const passport = require('./auth/passport');

// 👉 Import route đã chứa forgot-password và reset-password
const authRoutes = require('./routes/accountRoutes');
const protectedRoutes = require('./routes/protectedRoutes');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Session setup (cho Google OAuth nếu dùng)
app.use(session({
  secret: 'super-secret',
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// 🏠 Route kiểm tra server
app.get('/', (req, res) => {
  res.send('✅ Server Evelyn Beauty hoạt động! Vào /auth để dùng API.');
});

// ✅ Mount routes
app.use('/auth', authRoutes);              // Bao gồm: login, register, forgot-password, reset-password, google login
app.use('/api/protected', protectedRoutes); // Các route cần xác thực JWT hoặc role

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend đang chạy tại http://localhost:${PORT}`);
});
