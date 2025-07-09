const { OAuth2Client } = require("google-auth-library");
const bcrypt = require("bcrypt");
const { Account } = require("../models");
const jwt = require("jsonwebtoken");
const { sendOtpEmail } = require("../utils/mails");
const { createCartIfNotExists } = require("./cart.controllers");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (account) => {
  return jwt.sign(
    {
      accountId: account.accountId,
      email: account.email,
      role: account.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};

const loginAccount = async (req, res) => {
  const { email, password } = req.body;

  try {
    const account = await Account.findOne({
      where: {
        email: email.trim().toLowerCase(),
      },
    });

    if (!account) {
      return res.status(404).json({ message: "Tài khoản không tồn tại" });
    }

    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Mật khẩu không đúng" });
    }

    // Tạo cart nếu chưa có (gọi hàm từ cart.controllers)
    await createCartIfNotExists(account.accountId);

    const token = generateToken(account);
    const { password: _, ...accountSafe } = account.get({ plain: true });

    return res.status(200).json({
      message: "Đăng nhập thành công",
      account: accountSafe,
      token,
    });
  } catch (err) {
    console.error("Lỗi đăng nhập:", err);
    res.status(500).json({ message: "Đăng nhập thất bại" });
  }
};

const registerAccount = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ message: "Vui lòng nhập tên để đăng ký" });
  }

  try {
    const existing = await Account.findOne({ where: { email } });

    if (existing) {
      return res
        .status(409)
        .json({ message: "Tài khoản hoặc email đã tồn tại" });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      await sendOtpEmail(email, otpCode);
      console.log(` Gửi OTP ${otpCode} đến ${email}`);
    } catch (mailErr) {
      console.error(" Lỗi gửi OTP qua email:", mailErr);
      return res.status(500).json({
        message:
          "Không gửi được email OTP. Kiểm tra MAIL_USER/PASS hoặc app password",
      });
    }

    global.tempOtps = global.tempOtps || {};
    global.tempOtps[email] = {
      code: otpCode,
      expiredAt: Date.now() + 5 * 60 * 1000,
      name,
      password,
    };

    res.status(200).json({
      message:
        "Mã OTP đã gửi tới email. Vui lòng xác minh để hoàn tất đăng ký.",
      email,
    });
  } catch (err) {
    console.error("Lỗi gửi OTP:", err);
    res.status(500).json({ message: "Gửi OTP thất bại" });
  }
};

const googleLogin = async (req, res) => {
  const { credential } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    let account = await Account.findOne({ where: { email } });

    if (!account) {
      const newAccountId = "AC" + Date.now();
      const fakePassword = await bcrypt.hash("GOOGLE_AUTH", 10);

      account = await Account.create({
        accountId: newAccountId,
        name,
        email,
        password: fakePassword,
        role: "CU",
        status: "ON",
      });

      console.log(` Đã tạo tài khoản Google mới cho ${email}`);
    }

    const token = generateToken(account);
    const { password: _, ...accountSafe } = account.get({ plain: true });

    return res.status(200).json({
      message: "Đăng nhập Google thành công",
      account: accountSafe,
      token,
    });
  } catch (err) {
    console.error("Lỗi xác thực Google:", err);
    return res.status(401).json({ message: "Token Google không hợp lệ" });
  }
};

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  const record = global.tempOtps?.[email];

  if (!record)
    return res.status(400).json({ message: "Không tìm thấy mã OTP" });
  if (Date.now() > record.expiredAt)
    return res.status(410).json({ message: "Mã đã hết hạn" });
  if (record.code !== otp)
    return res.status(401).json({ message: "Mã không đúng" });

  const newAccountID = "AC" + Date.now();
  const account = await Account.create({
    accountId: newAccountID,
    name: record.name,
    email,
    password: await bcrypt.hash(record.password, 10),
    role: "CU",
    status: "ON",
  });

  // Tạo cart rỗng cho account mới nếu chưa có (gọi hàm từ cart.controllers)
  await createCartIfNotExists(newAccountID);

  delete global.tempOtps[email];

  res.status(201).json({ message: "Đăng ký thành công", account });
};

const logout = (req, res, next) => {
  req.logout(function (err) {
    if (err) return next(err);

    req.session.destroy(function (err) {
      if (err) return next(err);

      res.clearCookie("connect.sid"); // Nếu dùng session cookie
      res.status(200).json({ message: "Đăng xuất thành công!" });
    });
  });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const account = await Account.findOne({ where: { email } });
    if (!account)
      return res
        .status(200)
        .json({ message: "Nếu email tồn tại, chúng tôi đã gửi hướng dẫn." });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Lưu tạm OTP và thời hạn
    global.resetOtps = global.resetOtps || {};
    global.resetOtps[email] = {
      otp,
      accountId: account.accountId,
      expiredAt: Date.now() + 15 * 60 * 1000, // 15 phút
    };

    // Gửi email
    await sendOtpEmail(email, ` Mã đặt lại mật khẩu của bạn là: ${otp}`);

    res.status(200).json({
      message: " Mã OTP đặt lại mật khẩu đã được gửi tới email nếu tồn tại.",
    });
  } catch (err) {
    console.error("Lỗi gửi OTP reset:", err);
    res.status(500).json({ message: " Không gửi được OTP" });
  }
};

const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const record = global.resetOtps?.[email];
  if (!record)
    return res
      .status(400)
      .json({ message: " Không có yêu cầu đặt lại mật khẩu nào" });
  if (Date.now() > record.expiredAt)
    return res.status(410).json({ message: "Mã OTP đã hết hạn" });
  if (record.otp !== otp)
    return res.status(401).json({ message: " Mã OTP không chính xác" });

  try {
    const account = await Account.findOne({
      where: { accountId: record.accountId },
    });
    if (!account)
      return res.status(404).json({ message: " Tài khoản không tồn tại" });

    const hashed = await bcrypt.hash(newPassword, 10);
    account.password = hashed;
    await account.save();

    delete global.resetOtps[email];

    res.status(200).json({ message: " Đặt lại mật khẩu thành công" });
  } catch (err) {
    console.error("Lỗi đặt lại mật khẩu:", err);
    res.status(500).json({ message: " Có lỗi xảy ra" });
  }
};

// Chỉ dành cho OS , tạo đc role OS hoặc SF
const createAccountWithOtp = async (req, res) => {
  const { name, email, password, role, otp } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ message: "Vui lòng nhập tên để đăng ký" });
  }

  if (!["OS", "SF"].includes(role)) {
    return res
      .status(400)
      .json({ message: "Chỉ tạo được tài khoản OS hoặc SF" });
  }

  global.tempAdminOtps = global.tempAdminOtps || {};

  if (!otp) {
    const existing = await Account.findOne({ where: { email } });
    if (existing) return res.status(409).json({ message: "Email đã tồn tại" });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      await sendOtpEmail(
        email,
        `Mã xác nhận tạo tài khoản của bạn là: ${otpCode}`
      );

      global.tempAdminOtps[email] = {
        code: otpCode,
        expiredAt: Date.now() + 5 * 60 * 1000,
        name,
        password,
        role,
      };

      return res.status(200).json({
        message: "Mã OTP đã được gửi tới email. Gửi lại OTP để xác minh.",
        email,
      });
    } catch (err) {
      console.error("Lỗi gửi OTP:", err);
      return res.status(500).json({ message: "Không thể gửi mã OTP" });
    }
  }

  const record = global.tempAdminOtps[email];

  if (!record)
    return res
      .status(400)
      .json({ message: "Không có yêu cầu tạo tài khoản đang chờ OTP" });
  if (Date.now() > record.expiredAt)
    return res.status(410).json({ message: "Mã OTP đã hết hạn" });
  if (record.code !== otp)
    return res.status(401).json({ message: "Mã OTP không chính xác" });

  try {
    const hashed = await bcrypt.hash(record.password, 10);
    const newAccount = await Account.create({
      accountId: "AC" + Date.now(),
      name: record.name,
      email,
      password: hashed,
      role: record.role,
      status: "ON",
    });

    delete global.tempAdminOtps[email];

    return res
      .status(201)
      .json({ message: "Tạo tài khoản thành công", account: newAccount });
  } catch (err) {
    console.error("Lỗi tạo tài khoản:", err);
    return res.status(500).json({ message: "Lỗi khi tạo tài khoản" });
  }
};

// xem tất cả account
const getAllAccounts = async (req, res) => {
  try {
    const accounts = await Account.findAll({
      where: {
        role: ["OS", "SF"], // lọc các role là OS hoặc SF
      },
    });

    res.json({ accounts });
  } catch (err) {
    console.error("Lỗi khi lấy danh sách accounts:", err);
    res.status(500).json({ message: "Lỗi lấy danh sách account" });
  }
};

const updateAccount = async (req, res) => {
  const { accountId } = req.params;
  const { name, password } = req.body;

  try {
    const account = await Account.findByPk(accountId);
    if (!account)
      return res.status(404).json({ message: "Không tìm thấy account" });

    // Chỉ cho phép cập nhật nếu là OS hoặc SF
    if (account.role === "CU") {
      return res
        .status(403)
        .json({ message: "Không được phép cập nhật tài khoản Customer (CU)" });
    }

    if (name) account.name = name;
    if (password) account.password = await bcrypt.hash(password, 10);

    await account.save();
    res.json({ message: "Cập nhật thành công", account });
  } catch (err) {
    res.status(500).json({ message: "Lỗi cập nhật" });
  }
};

const deleteAccount = async (req, res) => {
  const { accountId } = req.params;
  const currentUserId = req.user.accountId; // Tài khoản đang đăng nhập

  try {
    const account = await Account.findByPk(accountId);
    if (!account)
      return res.status(404).json({ message: "Không tìm thấy account" });

    // Không cho xóa CU
    if (account.role === "CU") {
      return res.status(403).json({
        message: "Không được phép xóa tài khoản Customer (CU)",
      });
    }

    // Không cho tự xóa chính mình
    if (account.accountId === currentUserId) {
      return res.status(403).json({
        message: "Không thể xóa chính tài khoản của bạn đang sử dụng",
      });
    }

    // Thử xóa vĩnh viễn
    try {
      await account.destroy();
      res.json({ message: "Xóa vĩnh viễn account thành công" });
    } catch {
      // Nếu có ràng buộc khóa ngoại → chỉ set OFF
      account.status = "OFF";
      await account.save();
      res.json({ message: "Chuyển trạng thái account sang OFF" });
    }
  } catch (err) {
    console.error("Lỗi khi xóa account:", err);
    res.status(500).json({ message: "Lỗi xóa" });
  }
};

module.exports = {
  loginAccount,
  registerAccount,
  googleLogin,
  verifyOtp,
  logout,
  forgotPassword,
  resetPassword,
  createAccountWithOtp,
  getAllAccounts,
  updateAccount,
  deleteAccount,
};
