const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PromotionProgram = sequelize.define('PromotionProgram', {
  programId: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    field: 'program_id'
  },
  name: {
    type: DataTypes.STRING(5000),
    allowNull: true
  },
  condition1: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'condition_1'
  },
  condition2: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'condition_2'
  },
  value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'start_date'
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'end_date'
  },
  accountId: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'account_id'
  }
}, {
  tableName: 'promotion_programs',
  timestamps: false
});

PromotionProgram.associate = (models) => {
  PromotionProgram.belongsTo(models.Account, { foreignKey: 'accountId', as: 'creator' });
  PromotionProgram.hasMany(models.Order, { foreignKey: 'programId', as: 'orders' });
};

module.exports = PromotionProgram;
