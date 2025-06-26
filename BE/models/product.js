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
    quantity: DataTypes.INTEGER,
    brand: DataTypes.STRING(20),
    price: DataTypes.DECIMAL(15, 0),
    description: DataTypes.STRING(255),
    image: {
      type: DataTypes.TEXT,
      get() {
        const rawValue = this.getDataValue("image");
        if (!rawValue) return [];
        try {
          return JSON.parse(rawValue);
        } catch (error) {
          return rawValue ? [rawValue] : [];
        }
      },
      set(value) {
        if (Array.isArray(value)) {
          this.setDataValue("image", JSON.stringify(value));
        } else if (typeof value === "string") {
          this.setDataValue("image", JSON.stringify([value]));
        } else {
          this.setDataValue("image", JSON.stringify([]));
        }
      },
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
