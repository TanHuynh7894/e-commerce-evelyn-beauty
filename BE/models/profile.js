const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // ⬅️ Đảm bảo dòng này có

const Profile = sequelize.define('Profile', {
  profileId: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    field: 'profile_id'
  },
  accountId: {
    type: DataTypes.STRING(20),
    field: 'account_id'
  },
  name: DataTypes.STRING(40),
  phone: DataTypes.STRING(10),
  address: DataTypes.STRING(255),
  gender: DataTypes.ENUM('F', 'M'),
  birthday: DataTypes.DATE,
  image: DataTypes.STRING(2083)
}, {
  tableName: 'profiles',
  timestamps: false,
});

Profile.associate = (models) => {
  Profile.belongsTo(models.Account, { foreignKey: 'accountId', as: 'account' });
  Profile.hasMany(models.Order, { foreignKey: 'profileId', as: 'orders' });
};

module.exports = Profile;
