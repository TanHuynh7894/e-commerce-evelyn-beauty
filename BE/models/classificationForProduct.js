const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ClassificationProduct = sequelize.define("ClassificationProduct", {
  classificationId: {
    type: DataTypes.STRING(20),
    foreignKey: true,
    field: "classification_id",
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
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
}, {
  tableName: "classification_for_product",
  timestamps: false,
});

ClassificationProduct.associate = (models) => {
  ClassificationProduct.belongsTo(models.Classification, {
    foreignKey: "classificationId",
    as: "classification",
  });
  ClassificationProduct.belongsTo(models.Product, {
    foreignKey: "productId",
    as: "product",
  });
};

module.exports = ClassificationProduct;