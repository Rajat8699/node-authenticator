const cron = require('node-cron');
const db = require('../models');
const { Op } = require('sequelize');

cron.schedule('0 0 * * *', async () => {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  await db.User.destroy({
    where: {
      isDisabled: true,
      lastLogin: { [Op.lt]: date }
    }
  });
});

module.exports = cron;
