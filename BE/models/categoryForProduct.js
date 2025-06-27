const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CategoryProduct = sequelize.define(
  "CategoryProduct",
  {
    categoryId: {
      type: DataTypes.STRING(20),
      foreignKey: true,
      field: "category_id",
      references: {
        model: "category",
        key: "category_id",
      },
    },
    productId: {
      type: DataTypes.STRING(20),
      foreignKey: true,
      field: "product_id",
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

CategoryProduct.associate = (models) => {
  CategoryProduct.belongsTo(models.Category, {
    foreignKey: "categoryId",
    as: "category",
  });
  CategoryProduct.belongsTo(models.Product, {
    foreignKey: "productId",
    as: "product",
  });
};

module.exports = CategoryProduct;
