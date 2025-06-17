require('dotenv').config();
const nodemailer = require('nodemailer');

(async () => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT),
      secure: true, // dùng true nếu dùng port 465
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.verify();
    console.log('✅ SMTP OK: Gửi mail được');
  } catch (err) {
    console.error('❌ SMTP ERROR:', err.message);
  }
})();
