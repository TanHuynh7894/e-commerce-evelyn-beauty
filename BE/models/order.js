const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // ✅ Đảm bảo đã khai báo

const Order = sequelize.define('Order', {
  orderId: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    field: 'order_id'
  },
  programId: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'program_id'
  },
  shipFee: {
    type: DataTypes.DECIMAL(15, 0),
    allowNull: true,
    field: 'ship_fee'
  },
  date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('in_transit', 'delivered', 'returned', 'cancel', 'done'),
    allowNull: true
  },
  accountId: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'account_id'
  },
  paymentId: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'payment_id'
  },
  deliveryId: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'delivery_id'
  },
  profileId: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'profile_id'
  }
}, {
  tableName: 'orders',
  timestamps: false,
});

Order.associate = (models) => {
  Order.belongsTo(models.Account, { foreignKey: 'accountId', as: 'account' });
  Order.belongsTo(models.Profile, { foreignKey: 'profileId', as: 'profile' });
  Order.belongsTo(models.PromotionProgram, { foreignKey: 'programId', as: 'promotionProgram' });
  Order.belongsTo(models.Payment, { foreignKey: 'paymentId', as: 'payment' });
  Order.belongsTo(models.Delivery, { foreignKey: 'deliveryId', as: 'delivery' });

  Order.hasMany(models.OrderDetail, { foreignKey: 'orderId', as: 'details' });
  Order.hasOne(models.OrderCancel, { foreignKey: 'orderId', as: 'cancellation' });
};

module.exports = Order;
