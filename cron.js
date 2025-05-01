const cron = require('node-cron');
const User = require('./models/user');
const { Op } = require('sequelize');

const cleanupDisabledAccounts = async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await User.destroy({
      where: {
        isDisabled: true,
        lastLogin: {
          [Op.lt]: thirtyDaysAgo,
        },
      },
    });
    console.log('Disabled accounts cleanup completed');
  } catch (error) {
    console.error('Error cleaning up disabled accounts:', error);
  }
};

// Run every day at midnight
cron.schedule('0 0 * * *', cleanupDisabledAccounts);

module.exports = { cleanupDisabledAccounts };