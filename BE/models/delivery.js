const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // ✅ Bắt buộc cần import

const Delivery = sequelize.define('Delivery', {
  deliveryId: {
    type: DataTypes.STRING(20),
    primaryKey: true,
  },
  method: DataTypes.STRING(100),
  carrier: DataTypes.STRING(100),
}, {
  tableName: 'deliveries',
  timestamps: false,
});

Delivery.associate = (models) => {
  Delivery.hasOne(models.Order, {
    foreignKey: 'deliveryId',
    as: 'order',
  });
};

module.exports = Delivery;
