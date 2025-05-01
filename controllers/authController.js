const { Op } = require('sequelize');
const User = require('../models/user');
const Role = require('../models/role');
const { comparePassword, hashPassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const { sendResetPasswordEmail, sendMagicLinkEmail } = require('../services/authService');

const register = async (req, res) => {
  try {
    const { firstName, lastName, email, dateOfBirth, phone, profilePicture, password } = req.body;
    const userRole = await Role.findOne({ where: { name: 'user' } });
    
    const user = await User.create({
      firstName,
      lastName,
      email,
      dateOfBirth,
      phone,
      profilePicture,
      password: await hashPassword(password),
      RoleId: userRole.id,
    });

    const token = generateToken(user);
    res.status(201).json({ 
      token, 
      user: { 
        id: user.id, 
        firstName, 
        lastName, 
        email, 
        dateOfBirth, 
        phone, 
        profilePicture, 
        role: userRole.name 
      } 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const user = await User.findOne({
      where: {
        email: identifier,
      },
      include: Role,
    });

    if (!user || user.isDisabled) {
      return res.status(401).json({ message: 'Invalid credentials or disabled account' });
    }

    if (!(await comparePassword(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        firstName: user.firstName, 
        lastName: user.lastName, 
        email: user.email, 
        dateOfBirth: user.dateOfBirth, 
        phone: user.phone, 
        profilePicture: user.profilePicture, 
        role: user.Role.name 
      } 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    
    if (!user || user.isDisabled) {
      return res.status(404).json({ message: 'User not found or disabled' });
    }

    await sendResetPasswordEmail(user);
    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await User.findOne({
      where: {
        resetToken: token,
        resetTokenExpires: { [Op.gt]: Date.now() },
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    user.password = await hashPassword(newPassword);
    user.resetToken = null;
    user.resetTokenExpires = null;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const requestMagicLink = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email }, include: Role });
    
    if (!user || user.isDisabled) {
      return res.status(404).json({ message: 'User not found or disabled' });
    }

    await sendMagicLinkEmail(user);
    res.json({ message: 'Magic link sent' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const magicLinkLogin = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({
      where: {
        magicToken: token,
        magicTokenExpires: { [Op.gt]: Date.now() },
      },
      include: Role,
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired magic link' });
    }

    user.lastLogin = new Date();
    user.magicToken = null;
    user.magicTokenExpires = null;
    await user.save();

    const authToken = generateToken(user);
    res.json({ 
      authToken, 
      user: { 
        id: user.id, 
        firstName: user.firstName, 
        lastName: user.lastName, 
        email: user.email, 
        dateOfBirth: user.dateOfBirth, 
        phone: user.phone, 
        profilePicture: user.profilePicture, 
        role: user.Role.name 
      } 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  requestPasswordReset,
  resetPassword,
  requestMagicLink,
  magicLinkLogin,
};