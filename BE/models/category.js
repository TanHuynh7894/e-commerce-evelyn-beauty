const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  categoryId: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    field: 'category_id'
  },
  name: DataTypes.STRING(40)
}, {
  tableName: 'category',
  timestamps: false
});

Category.associate = (models) => {
  Category.belongsTo(models.Account, { 
    foreignKey: 'accountId',
    as: 'creator' 
});

  Category.belongsTo(models.CategoryProduct, {
  foreignKey: 'categoryProductId',
  as: 'categoryProduct',
});
};

module.exports = Category;
