const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const passport = require('./auth/passport');
const accountRoutes = require('./routes/account.routes');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use(session({
  secret: 'super-secret',
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
  res.send('✅ Server Evelyn Beauty hoạt động! Vào /auth để dùng API.');
});

app.use('/auth', accountRoutes);
app.use('/api/auth', accountRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend đang chạy tại http://localhost:${PORT}`);
});
