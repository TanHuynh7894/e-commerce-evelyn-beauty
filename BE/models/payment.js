const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // ✅ Thêm dòng này

const Payment = sequelize.define('Payment', {
  paymentId: {
    type: DataTypes.STRING(20),
    primaryKey: true,
  },
  method: DataTypes.STRING(100),
  status: DataTypes.ENUM('pending', 'completed', 'failed'),
}, {
  tableName: 'payments',
  timestamps: false,
});

Payment.associate = (models) => {
  Payment.hasMany(models.Order, { foreignKey: 'paymentId', as: 'orders' });
};

module.exports = Payment;
