const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Account = sequelize.define(
  "Account",
  {
    accountId: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      field: "account_id",
    },
    name: DataTypes.STRING(40),
    email: {
      type: DataTypes.STRING(320),
      unique: true,
    },
    password: DataTypes.STRING(130),
    role: DataTypes.ENUM("OS", "SF", "CU"),

    status: {
      type: DataTypes.ENUM("ON", "OFF"),
      allowNull: false,
      defaultValue: "ON",
    },
  },
  {
    tableName: "accounts",
    timestamps: false,
  }
);

Account.associate = (models) => {
  Account.hasMany(models.Profile, { foreignKey: "accountId", as: "profiles" });
  Account.hasOne(models.Cart, { foreignKey: "accountId", as: "cart" });
  Account.hasMany(models.Order, { foreignKey: "accountId", as: "orders" });
  Account.hasMany(models.PromotionProgram, {
    foreignKey: "accountId",
    as: "promotionPrograms",
  });
  Account.hasMany(models.OrderCancel, {
    foreignKey: "accountId",
    as: "orderCancels",
  });
  Account.hasMany(models.Category, {
    foreignKey: "accountId",
    as: "categories",
  });
};

module.exports = Account;
