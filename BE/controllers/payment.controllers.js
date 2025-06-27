const moment = require('moment');
const crypto = require('crypto');
const qs = require('qs');

const createPaymentUrl = async (req, res) => {
  const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  const tmnCode = process.env.VNP_TMNCODE;
  const secretKey = process.env.VNP_HASHSECRET;
  const vnpUrl = process.env.VNP_URL;
  const returnUrl = process.env.VNP_RETURNURL;

  const date = new Date();
  const createDate = moment(date).format('YYYYMMDDHHmmss');
  const orderId = 'OD' + date.getTime();
  const amount = req.body.amount;

  const vnp_Params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Locale: req.body.language || 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: orderId,
    vnp_OrderInfo: req.body.orderDescription,
    vnp_OrderType: req.body.orderType || 'other',
    vnp_Amount: amount * 100,
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
  };

  // Nếu có bankCode thì mới gán vào
  if (req.body.bankCode) {
    vnp_Params.vnp_BankCode = req.body.bankCode;
  }

  const sortedParams = sortObject(vnp_Params);
  const signData = qs.stringify(sortedParams, { encode: false });
  const hmac = crypto.createHmac('sha512', secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  sortedParams.vnp_SecureHash = signed;
  const paymentUrl = `${vnpUrl}?${qs.stringify(sortedParams, { encode: false })}`;

  console.log("Body nhận được:", req.body);
  res.json({ paymentUrl });
};

// Sắp xếp object theo alphabet
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (let key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}

const verifyVnpayCallback = (req, res) => {
  const { vnp_SecureHash, ...params } = req.query;
  const secretKey = process.env.VNP_HASHSECRET;

  const sorted = sortObject(params);
  const signData = qs.stringify(sorted, { encode: false });
  const hmac = crypto.createHmac('sha512', secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  if (vnp_SecureHash === signed) {
    if (params.vnp_ResponseCode === '00') {
      return res.redirect(`/success?orderId=${params.vnp_TxnRef}`);
    } else {
      return res.redirect(`/failed?orderId=${params.vnp_TxnRef}`);
    }
  } else {
    return res.status(400).send('Chữ ký không hợp lệ');
  }
};

module.exports = { createPaymentUrl, verifyVnpayCallback };
