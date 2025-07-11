const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Thêm dòng này

const Payment = sequelize.define('Payment', {
  paymentId: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    field: 'payment_id',
  },
  transactionNo: {
    type: DataTypes.INTEGER,
    field: 'transaction_no',
  }
  }, {
  tableName: 'payment',
  timestamps: false,
});

Payment.associate = (models) => {
  Payment.hasMany(models.Order, { foreignKey: 'payment_id', as: 'orders' });
};

module.exports = Payment;
