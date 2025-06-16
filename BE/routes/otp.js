const express = require('express');
const router = express.Router();
const { verifyOtp } = require('../controllers/otpController');

router.post('/verify-otp', verifyOtp);

module.exports = router;
