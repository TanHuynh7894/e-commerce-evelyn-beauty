const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  productId: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    field: 'product_id'
  },
  name: DataTypes.STRING(5000),
  origin: DataTypes.STRING(20),
  quantity: DataTypes.INTEGER,
  brand: DataTypes.STRING(20),
  price: DataTypes.DECIMAL(15, 0),
  description: DataTypes.STRING(255),
  image: DataTypes.STRING(2083)
}, {
  tableName: 'products',
  timestamps: false
});

Product.associate = (models) => {
  Product.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
  Product.hasMany(models.Cart, { foreignKey: 'productId', as: 'cartItems' });
  Product.hasMany(models.OrderDetail, { foreignKey: 'productId', as: 'orderDetails' });
};

module.exports = Product;
