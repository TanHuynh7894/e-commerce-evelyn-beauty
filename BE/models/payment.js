const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  paymentId: {
    type: DataTypes.STRING(20),
    allowNull: false,
    primaryKey: true,
    field: 'payment_id'
  },
  transactionNo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'transaction_no'
  }
}, {
  tableName: 'payment',
  timestamps: false
});

Payment.associate = (models) => {
  Payment.hasOne(models.Order, { foreignKey: 'paymentId', as: 'order' });
};

module.exports = Payment;