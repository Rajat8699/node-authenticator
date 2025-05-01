const User = require('../models/user');
const Role = require('../models/role');
const { hashPassword } = require('../utils/password');
const { sendPhoneVerificationOtp } = require('../services/authService');

const updateUser = async (req, res) => {
  try {
    const { firstName, lastName, email, dateOfBirth, phone, profilePicture, password, useRefreshTokens } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.dateOfBirth = dateOfBirth || user.dateOfBirth;
    if (phone && phone !== user.phone) {
      user.phone = phone;
      user.isPhoneVerified = false;
      await sendPhoneVerificationOtp(user);
    }
    user.profilePicture = profilePicture || user.profilePicture;
    user.useRefreshTokens = typeof useRefreshTokens === 'boolean' ? useRefreshTokens : user.useRefreshTokens;
    if (password) {
      user.password = await hashPassword(password);
    }
    if (!user.useRefreshTokens) {
      await Session.destroy({ where: { UserId: user.id } });
    }
    await user.save();

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await Session.destroy({ where: { UserId: user.id } });
    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const disableUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isDisabled = true;
    await Session.destroy({ where: { UserId: user.id } });
    await user.save();
    res.json({ message: 'User disabled successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  updateUser,
  deleteUser,
  disableUser,
};