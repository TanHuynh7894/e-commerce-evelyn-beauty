const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Classification = sequelize.define(
  "Classification",
  {
    classificationId: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      field: "classification_id",
    },
    name: {
      type: DataTypes.STRING(40),
      field: "name",
    },
    status: {
      type: DataTypes.ENUM("ON", "OFF"),
      allowNull: false,
      defaultValue: "ON",
    },
  },
  {
    tableName: "classification",
    timestamps: false,
  }
);

Classification.associate = (models) => {
  Classification.belongsToMany(models.Product, {
    through: models.ClassificationProduct,
    foreignKey: "classificationId",
    otherKey: "productId",
    as: "products",
  });
};

module.exports = Classification;
