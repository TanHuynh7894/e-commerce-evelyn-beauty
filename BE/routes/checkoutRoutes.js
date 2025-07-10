const express = require('express');
const router = express.Router();
const { checkout } = require('../controllers/checkout.controllers');
const { verifyToken } = require('../middlewares/auth');

// API tổng hợp cho checkout
router.post('/', verifyToken, checkout);

module.exports = router;
