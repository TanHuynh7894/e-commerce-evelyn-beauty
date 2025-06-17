const { OAuth2Client } = require('google-auth-library');
const bcrypt = require('bcrypt');
const { Account } = require('../models');
const jwt = require('jsonwebtoken');
const { sendOtpEmail } = require('../utils/mails');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (account) => {
  return jwt.sign(
    {
      accountId: account.accountId,
      email: account.email,
      role: account.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

const loginAccount = async (req, res) => {
  const { email, password } = req.body;

  try {
    const account = await Account.findOne({
      where: {
        email: email.trim().toLowerCase()
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

const registerAccount = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existing = await Account.findOne({ where: { email } });

    if (existing) {
      return res.status(409).json({ message: 'Tài khoản hoặc email đã tồn tại' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      await sendOtpEmail(email, otpCode);
      console.log(` Gửi OTP ${otpCode} đến ${email}`);
    } catch (mailErr) {
      console.error(' Lỗi gửi OTP qua email:', mailErr);
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

const googleLogin = async (req, res) => {
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

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  const record = global.tempOtps?.[email];

  if (!record) return res.status(400).json({ message: 'Không tìm thấy mã OTP' });
  if (Date.now() > record.expiredAt) return res.status(410).json({ message: 'Mã đã hết hạn' });
  if (record.code !== otp) return res.status(401).json({ message: 'Mã không đúng' });

  const newAccountID = "AC" + Date.now();
  const account = await Account.create({
    accountId: newAccountID,
    name: record.name,
    email,
    password: await bcrypt.hash(record.password, 10),
    role: 'CU',
    googleId: record.googleId
  });

  delete global.tempOtps[email];

  res.status(201).json({ message: 'Đăng ký thành công', account });
};

const logout = (req, res, next) => {
  req.logout(function(err) {
    if (err) return next(err);

    req.session.destroy(function(err) {
      if (err) return next(err);

      res.clearCookie('connect.sid'); // Nếu dùng session cookie
      res.status(200).json({ message: 'Đăng xuất thành công!' });
    });
  });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const account = await Account.findOne({ where: { email } });
    if (!account) return res.status(200).json({ message: 'Nếu email tồn tại, chúng tôi đã gửi hướng dẫn.' });

    const token = jwt.sign(
      { accountId: account.accountId, email: account.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const resetLink = `http://localhost:3000/reset-password?token=${token}`;
    await sendOtpEmail(email, `Bấm vào đây để đặt lại mật khẩu: ${resetLink}`);

    res.status(200).json({ message: 'Hướng dẫn đặt lại mật khẩu đã được gửi nếu email tồn tại.' });
  } catch (err) {
    console.error('Lỗi gửi link quên mật khẩu:', err);
    res.status(500).json({ message: 'Không gửi được link quên mật khẩu' });
  }
};

const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const account = await Account.findOne({ where: { accountId: decoded.accountId } });

    if (!account) return res.status(404).json({ message: 'Tài khoản không tồn tại' });

    const hashed = await bcrypt.hash(newPassword, 10);
    account.password = hashed;
    await account.save();

    res.status(200).json({ message: 'Đặt lại mật khẩu thành công' });
  } catch (err) {
    console.error('Lỗi xác thực token reset:', err);
    res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};


module.exports = {
  loginAccount,
  registerAccount,
  googleLogin,
  verifyOtp,
  logout,
  forgotPassword,
  resetPassword
};
