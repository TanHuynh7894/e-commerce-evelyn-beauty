const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CategoryProduct = sequelize.define('CategoryProduct', {
  categoryProductId: {
    type: DataTypes.STRING(20),
    primaryKey: true,
  },
  name: DataTypes.STRING(100),
  description: DataTypes.STRING(255),
}, {
  tableName: 'category_products',
  timestamps: false,
});

CategoryProduct.associate = (models) => {
  CategoryProduct.hasMany(models.Category, {
    foreignKey: 'categoryProductId',
    as: 'categories',
  });

  CategoryProduct.hasMany(models.Product, {
    foreignKey: 'categoryProductId',
    as: 'products',
  });
};

module.exports = CategoryProduct;
