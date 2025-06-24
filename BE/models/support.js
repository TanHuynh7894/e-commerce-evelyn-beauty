const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Support = sequelize.define('Support', {
  supportId: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    field: 'support_id'
  },
  accountIdCustomer: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'account_id_customer'
  },
  accountIdStaff: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'account_id_staff'
  },
  dateCreate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'date_create'
  },
  comment: {
    type: DataTypes.STRING(5000),
    allowNull: true
  },
  dateResolve: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'date_resolve'
  },
  resolve: {
    type: DataTypes.STRING(5000),
    allowNull: true
  }
}, {
  tableName: 'support',
  timestamps: false
});

Support.associate = (models) => {
  Support.belongsTo(models.Account, { foreignKey: 'accountIdCustomer', as: 'customer' });
  Support.belongsTo(models.Account, { foreignKey: 'accountIdStaff', as: 'staff' });
};

module.exports = Support;
