const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cart = sequelize.define('Cart', {
  cartId: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    field: 'cart_id'
  },
  accountId: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'account_id'
  }
}, {
  tableName: 'cart',
  timestamps: false
});

// Thiết lập mối quan hệ
Cart.associate = (models) => {
  Cart.belongsTo(models.Account, { foreignKey: 'accountId', as: 'account' });
  Cart.hasMany(models.CartItem, { foreignKey: 'cartId', as: 'cartItems' });
};

module.exports = Cart;
