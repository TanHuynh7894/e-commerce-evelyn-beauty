const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderDetail = sequelize.define('OrderDetail', {
  orderDetailId: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    field: 'orderDetail_id'
  },
  productId: {
    type: DataTypes.STRING(20),
    field: 'product_id'
  },
  orderId: {
    type: DataTypes.STRING(20),
    field: 'order_id'
  },
  quantity: DataTypes.INTEGER,
  comment: DataTypes.STRING(5000),
  rate: DataTypes.INTEGER,
  imageEvaluate: {
    type: DataTypes.STRING(2083),
    field: 'image_evaluate'
  }
}, {
  tableName: 'order_details',
  timestamps: false
});

OrderDetail.associate = (models) => {
  OrderDetail.belongsTo(models.Order, { foreignKey: 'orderId', as: 'order' });
  OrderDetail.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
};

module.exports = OrderDetail;
