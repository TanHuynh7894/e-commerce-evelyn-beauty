const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

exports.sendOtpEmail = async (to, otp) => {
  await transporter.sendMail({
    from: `"Evelyn Beauty" <${process.env.MAIL_USER}>`,
    to,
    subject: 'Xác minh OTP - Evelyn Beauty',
    text: `Mã OTP của bạn là: ${otp}`
  });
};
