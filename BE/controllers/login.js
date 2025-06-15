const { OAuth2Client } = require('google-auth-library');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { Account } = require('../models'); // Import models chung
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Tạo JWT token
const generateToken = (account) => {
  return jwt.sign(
    {
      accountId: account.accountId,
      email: account.email,
      role: account.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};


// ---------------------------
// 🔐 Đăng nhập (truyền thống)
// ---------------------------
exports.loginAccount = async (req, res) => {
  const { login, password } = req.body;

  try {
    // Cho phép login là email hoặc accountId
    const account = await Account.findOne({
      where: {
        email: login.trim().toLowerCase()  
      }
    });

    if (!account) {
      return res.status(404).json({ message: 'Tài khoản không tồn tại' });
    }

    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Mật khẩu không đúng' });
    }
    const token = generateToken(account);
    const { password: _, ...accountSafe } = account.get({ plain: true });

    return res.status(200).json({
      message: 'Đăng nhập thành công',
      account: accountSafe, token
    });
  } catch (err) {
    console.error('Lỗi đăng nhập:', err);
    res.status(500).json({ message: 'Đăng nhập thất bại' });
  }
};

// ---------------------------
// 🆕 Đăng ký (truyền thống)
// ---------------------------
exports.registerAccount = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existing = await Account.findOne({
      where: {
          email
      }
    });

    if (existing) {
      return res.status(409).json({ message: 'Tài khoản hoặc email đã tồn tại' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const newAccountID = "AC" + Date.now();
    const newAccount = await Account.create({
      accountId: newAccountID,
      name,
      email,
      password: hashed,
      role: 'CU',
      googleId: null
    });

    res.status(201).json({ message: 'Đăng ký thành công', account: newAccount });
  } catch (err) {
    console.error('Lỗi đăng ký:', err);
    res.status(500).json({ message: 'Đăng ký thất bại' });
  }
};

// ---------------------------
// 🔐 Google Login/Register
// ---------------------------
exports.googleLogin = async (req, res) => {
  const { credential, action } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub } = payload;

    let account = await Account.findOne({ where: { email } });

    if (action === 'register') {
      if (account) return res.status(409).json({ message: 'Tài khoản đã tồn tại' });

      const newAccountID = "AC" + Date.now();
      account = await Account.create({
        accountId: newAccountID,
        name,
        email,
        password: 'GOOGLE_USER',
        role: 'CU',
        googleId: sub
      });

      return res.status(201).json({ message: 'Đăng ký thành công', account });
    }

    if (action === 'login') {
      if (!account) return res.status(404).json({ message: 'Tài khoản chưa đăng ký' });
      return res.status(200).json({ message: 'Đăng nhập thành công', account });
    }

    res.status(400).json({ message: 'Hành động không hợp lệ' });

    const token = generateToken(account);
    const { password: _, ...accountSafe } = account.get({ plain: true });

    return res.status(200).json({
      message: 'Đăng nhập thành công',
      account: accountSafe, token
    });
  } catch (err) {
    console.error('Lỗi xác thực Google:', err);
    res.status(401).json({ message: 'Token không hợp lệ' });
  }
};
