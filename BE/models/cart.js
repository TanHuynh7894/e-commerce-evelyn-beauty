const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cart = sequelize.define('Cart', {
  cartId: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    field: 'cart_id'
  },
  productId: {
    type: DataTypes.STRING(20),
    field: 'product_id'
  },
  accountId: {
    type: DataTypes.STRING(20),
    field: 'account_id'
  },
  quantity: DataTypes.INTEGER
}, {
  tableName: 'cart',
  timestamps: false
});

// Thiết lập mối quan hệ
Cart.associate = (models) => {
  Cart.belongsTo(models.Account, { foreignKey: 'accountId', as: 'account' });
  Cart.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
};

module.exports = Cart;
