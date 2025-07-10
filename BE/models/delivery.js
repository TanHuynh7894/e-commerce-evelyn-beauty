const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // ✅ Bắt buộc cần import

const Delivery = sequelize.define(
  "Delivery",
  {
    deliveryId: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      field: "delivery_id",
    },
    transaction_no: DataTypes.STRING(100),
  },
  {
    tableName: "delivery",
    timestamps: false,
  }
);

Delivery.associate = (models) => {
  Delivery.hasOne(models.Order, {
    foreignKey: "deliveryId",
    as: "order",
  });
};

module.exports = Delivery;
