const nodemailer = require('nodemailer');

exports.sendOtpEmail = async (to, otpCode) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to,
    subject: 'Mã OTP xác thực',
    text: `Mã xác thực của bạn là: ${otpCode}`
  });
};
