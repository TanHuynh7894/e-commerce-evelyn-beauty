const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderCancel = sequelize.define('OrderCancel', {
  orderCancelId: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    field: 'orderCancel_id'
  },
  orderId: {
    type: DataTypes.STRING(20),
    field: 'order_id'
  },
  date: DataTypes.DATE,
  accountId: {
    type: DataTypes.STRING(20),
    field: 'account_id'
  }
}, {
  tableName: 'order_cancel',
  timestamps: false
});

module.exports = OrderCancel;
