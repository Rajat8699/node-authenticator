const User = require('../models/user');
const Role = require('../models/role');
const { hashPassword } = require('../utils/password');

const updateUser = async (req, res) => {
  try {
    const { firstName, lastName, email, dateOfBirth, phone, profilePicture, password } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.dateOfBirth = dateOfBirth || user.dateOfBirth;
    user.phone = phone || user.phone;
    user.profilePicture = profilePicture || user.profilePicture;
    if (password) {
      user.password = await hashPassword(password);
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