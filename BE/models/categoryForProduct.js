const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CategoryProduct = sequelize.define(
  "CategoryProduct",
  {
    categoryId: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      references: {
        model: "category",
        key: "category_id",
      },
    },
    productId: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      references: {
        model: "products",
        key: "product_id",
      },
    },
  },
  {
    tableName: "product_category",
    timestamps: false,
  }
);

module.exports = CategoryProduct;
