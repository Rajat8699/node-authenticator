const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserModel = require('./user');
const RoleModel = require('./role');

const User = UserModel(sequelize);
const Role = RoleModel(sequelize);

sequelize.sync();

module.exports = { Sequelize, sequelize, User, Role };
