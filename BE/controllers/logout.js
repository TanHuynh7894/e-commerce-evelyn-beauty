exports.logout = (req, res, next) => {
  req.logout(function(err) {
    if (err) return next(err);

    req.session.destroy(function(err) {
      if (err) return next(err);

      res.clearCookie('connect.sid'); // Nếu dùng session cookie
      res.status(200).json({ message: 'Đăng xuất thành công!' });
    });
  });
};
