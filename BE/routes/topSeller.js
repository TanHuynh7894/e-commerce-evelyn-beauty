const express = require('express');
const { getAllProductIds } = require('../controllers/topSeller');

const router = express.Router();

router.get('/product-ids', getAllProductIds);  // đổi sang GET như đã khuyến nghị

module.exports = router;
