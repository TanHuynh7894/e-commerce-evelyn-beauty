const express = require('express');
const router = express.Router();
const passport = require('../auth/passport');

// Bắt đầu Google OAuth
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// Callback từ Google
router.get('/google/callback', 
  passport.authenticate('google', {
    failureRedirect: '/login',
    session: false
  }),
  (req, res) => {
    res.json({
      message: 'Đăng nhập Google thành công!',
      user: req.user
    });
  }
);

module.exports = router;
