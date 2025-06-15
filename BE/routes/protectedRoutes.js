const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');

router.get('/', verifyToken, (req, res) => {
  res.json({
    message: '✅ Truy cập thành công',
    user: req.user
  });
});

module.exports = router;
