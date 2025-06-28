const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Product = sequelize.define(
  "Product",
  {
    productId: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      field: "product_id",
    },
    name: DataTypes.STRING(5000),
    origin: DataTypes.STRING(20),
    brand: DataTypes.STRING(20),
    price: DataTypes.DECIMAL(15, 0),
    description: DataTypes.STRING(255),
    image_1: DataTypes.STRING(2083),
    image_2: DataTypes.STRING(2083),
    image_3: DataTypes.STRING(2083),
    image_4: DataTypes.STRING(2083),
    image_5: DataTypes.STRING(2083),
    accountId: {
      type: DataTypes.STRING(20),
      field: "account_id",
    },
  },
  {
    tableName: "products",
    timestamps: false,
  }
);

Product.associate = (models) => {
  Product.belongsToMany(models.Category, {
    through: models.CategoryProduct, // bảng trung gian
    foreignKey: "productId",
    otherKey: "categoryId",
    as: "categories",
  });
  Product.hasMany(models.Cart, { foreignKey: "productId", as: "cartItems" });
  Product.hasMany(models.OrderDetail, {
    foreignKey: "productId",
    as: "orderDetails",
  });
};

module.exports = Product;
