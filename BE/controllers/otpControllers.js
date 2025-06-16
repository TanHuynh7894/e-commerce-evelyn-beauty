const { Account } = require('../models');

exports.verifyOtp = async (req, res) => {
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
    password: 'GOOGLE_USER',
    role: 'CU',
    googleId: record.googleId
  });

  delete global.tempOtps[email];

  res.status(201).json({ message: 'Đăng ký thành công', account });
};
