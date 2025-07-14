const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // Thêm dòng này

const Payment = sequelize.define(
  "Payment",
  {
    paymentId: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      field: "payment_id",
    },
    AccountBankId: {
      type: DataTypes.STRING(50),
      field: "AccountBankId",
    },
    AccountName: {
      type: DataTypes.STRING(50),
      field: "AccountName",
    },
    AccountNumber: {
      type: DataTypes.STRING(50),
      field: "AccountNumber",
    },
    transactionNo: {
      type: DataTypes.STRING(20),
      field: "transaction_no",
    },
  },
  {
    tableName: "payment",
    timestamps: false,
  }
);

Payment.associate = (models) => {
  Payment.hasMany(models.Order, { foreignKey: "payment_id", as: "orders" });
};

module.exports = Payment;
