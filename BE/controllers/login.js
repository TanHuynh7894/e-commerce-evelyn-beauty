const { OAuth2Client } = require('google-auth-library');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { Account } = require('../models'); // Import models chung
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const { sendOtpEmail } = require('../utils/mails');

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
// 🆕 Đăng ký truyền thống + gửi OTP
// ---------------------------
exports.registerAccount = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existing = await Account.findOne({ where: { email } });

    if (existing) {
      return res.status(409).json({ message: 'Tài khoản hoặc email đã tồn tại' });
    }

    // Tạo mã OTP và gửi mail
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      await sendOtpEmail(email, otpCode);
      console.log(`✅ Gửi OTP ${otpCode} đến ${email}`);
    } catch (mailErr) {
      console.error('❌ Lỗi gửi OTP qua email:', mailErr);
      return res.status(500).json({ message: 'Không gửi được email OTP. Kiểm tra MAIL_USER/PASS hoặc app password' });
    }

    global.tempOtps = global.tempOtps || {};
    global.tempOtps[email] = {
      code: otpCode,
      expiredAt: Date.now() + 5 * 60 * 1000,
      name,
      password
    };

    res.status(200).json({ message: 'Mã OTP đã gửi tới email. Vui lòng xác minh để hoàn tất đăng ký.', email });
  } catch (err) {
    console.error('Lỗi gửi OTP:', err);
    res.status(500).json({ message: 'Gửi OTP thất bại' });
  }
};

// ---------------------------
// 🔐 Google Login (chỉ đăng nhập)
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

    if (action === 'login') {
      if (!account) return res.status(404).json({ message: 'Tài khoản chưa đăng ký' });

      const token = generateToken(account);
      const { password: _, ...accountSafe } = account.get({ plain: true });

      return res.status(200).json({
        message: 'Đăng nhập thành công',
        account: accountSafe, token
      });
    }

    res.status(400).json({ message: 'Hành động không hợp lệ' });
  } catch (err) {
    console.error('Lỗi xác thực Google:', err);
    res.status(401).json({ message: 'Token không hợp lệ' });
  }
};
