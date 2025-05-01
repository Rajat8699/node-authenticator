const cron = require('node-cron');
const User = require('./models/user');
const Session = require('./models/session');
const { Op } = require('sequelize');

const cleanupDisabledAccounts = async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const disabledUsers = await User.findAll({
      where: {
        isDisabled: true,
        lastLogin: { [Op.lt]: thirtyDaysAgo },
      },
    });

    for (const user of disabledUsers) {
      await Session.destroy({ where: { UserId: user.id } });
      await user.destroy();
    }
    console.log('Disabled accounts cleanup completed');
  } catch (error) {
    console.error('Error cleaning up disabled accounts:', error);
  }
};

// Run every day at midnight
cron.schedule('0 0 * * *', cleanupDisabledAccounts);

module.exports = { cleanupDisabledAccounts };