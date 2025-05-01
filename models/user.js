const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');
const Role = require('./role');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  profilePicture: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: /^[0-9+\-\s]{8,15}$/, // Basic phone number validation
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isDisabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  resetToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resetTokenExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  magicToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  magicTokenExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  googleId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  useRefreshTokens: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  emailVerificationToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  emailVerificationExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  isPhoneVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  phoneVerificationOtp: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  phoneVerificationExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  loginOtp: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  loginOtpExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

User.belongsTo(Role);
Role.hasMany(User);

module.exports = User;