const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CartItem = sequelize.define('CartItem', {
  cartId: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'cart_id',
    primaryKey: true
  },
  productId: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'product_id',
    primaryKey: true
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  }
}, {
  tableName: 'cart_item',
  timestamps: false
});

// Thiết lập mối quan hệ
CartItem.associate = (models) => {
  CartItem.belongsTo(models.Cart, { foreignKey: 'cartId', as: 'cart' });
  CartItem.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
};

module.exports = CartItem; 