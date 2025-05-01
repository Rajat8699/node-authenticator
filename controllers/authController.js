const { Op } = require('sequelize');
const User = require('../models/user');
const Session = require('../models/session');
const Role = require('../models/role');
const { comparePassword, hashPassword } = require('../utils/password');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { 
  sendResetPasswordEmail, 
  sendMagicLinkEmail, 
  sendEmailVerificationEmail, 
  sendLoginOtpEmail, 
  sendPhoneVerificationOtp 
} = require('../services/authService');

const register = async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      dateOfBirth, 
      phone, 
      profilePicture, 
      password, 
      useRefreshTokens = true 
    } = req.body;
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
      useRefreshTokens,
    });

    await sendEmailVerificationEmail(user);
    if (phone) {
      await sendPhoneVerificationOtp(user);
    }

    res.status(201).json({ 
      message: 'User registered. Please verify your email to log in.',
      user: { 
        id: user.id, 
        firstName, 
        lastName, 
        email, 
        dateOfBirth, 
        phone, 
        profilePicture, 
        role: userRole.name,
        useRefreshTokens 
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
      where: { email: identifier },
      include: Role,
    });

    if (!user || user.isDisabled) {
      return res.status(401).json({ message: 'Invalid credentials or disabled account' });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ message: 'Email not verified' });
    }

    if (user.phone && !user.isPhoneVerified) {
      return res.status(403).json({ message: 'Phone not verified' });
    }

    if (!(await comparePassword(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    const accessToken = generateAccessToken(user, user.useRefreshTokens);
    let refreshToken;
    if (user.useRefreshTokens) {
      refreshToken = generateRefreshToken(user);
      await Session.create({
        UserId: user.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        deviceInfo: req.get('User-Agent'), // Simplified; parse for detailed device info if needed
      });
    }
    await user.save();

    res.json({ 
      accessToken, 
      refreshToken: user.useRefreshTokens ? refreshToken : undefined,
      user: { 
        id: user.id, 
        firstName: user.firstName, 
        lastName: user.lastName, 
        email: user.email, 
        dateOfBirth: user.dateOfBirth, 
        phone: user.phone, 
        profilePicture: user.profilePicture, 
        role: user.Role.name,
        useRefreshTokens: user.useRefreshTokens 
      } 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const otpLogin = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || user.isDisabled) {
      return res.status(404).json({ message: 'User not found or disabled' });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ message: 'Email not verified' });
    }

    if (user.phone && !user.isPhoneVerified) {
      return res.status(403).json({ message: 'Phone not verified' });
    }

    await sendLoginOtpEmail(user);
    res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const otpVerify = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({
      where: {
        email,
        loginOtp: otp,
        loginOtpExpires: { [Op.gt]: Date.now() },
      },
      include: Role,
    });

    if (!user || user.isDisabled) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.lastLogin = new Date();
    user.loginOtp = null;
    user.loginOtpExpires = null;
    const accessToken = generateAccessToken(user, user.useRefreshTokens);
    let refreshToken;
    if (user.useRefreshTokens) {
      refreshToken = generateRefreshToken(user);
      await Session.create({
        UserId: user.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        deviceInfo: req.get('User-Agent'),
      });
    }
    await user.save();

    res.json({ 
      accessToken, 
      refreshToken: user.useRefreshTokens ? refreshToken : undefined,
      user: { 
        id: user.id, 
        firstName: user.firstName, 
        lastName: user.lastName, 
        email: user.email, 
        dateOfBirth: user.dateOfBirth, 
        phone: user.phone, 
        profilePicture: user.profilePicture, 
        role: user.Role.name,
        useRefreshTokens: user.useRefreshTokens 
      } 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const logout = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete all sessions for the user
    await Session.destroy({ where: { UserId: user.id } });

    res.json({ message: 'Logged out successfully from all devices' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getSessions = async (req, res) => {
  try {
    const sessions = await Session.findAll({
      where: { UserId: req.user.id },
      attributes: ['id', 'ipAddress', 'userAgent', 'deviceInfo', 'expiresAt', 'createdAt'],
    });
    res.json({ sessions });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const requestEmailVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || user.isDisabled) {
      return res.status(404).json({ message: 'User not found or disabled' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    await sendEmailVerificationEmail(user);
    res.json({ message: 'Verification email sent' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: { [Op.gt]: Date.now() },
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const requestPhoneVerification = async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await User.findOne({ where: { phone } });

    if (!user || user.isDisabled) {
      return res.status(404).json({ message: 'User not found or disabled' });
    }

    if (user.isPhoneVerified) {
      return res.status(400).json({ message: 'Phone already verified' });
    }

    await sendPhoneVerificationOtp(user);
    res.json({ message: 'Verification OTP sent to phone' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const verifyPhone = async (req, res) => {
  try {
    const { otp } = req.params;
    const user = await User.findOne({
      where: {
        phoneVerificationOtp: otp,
        phoneVerificationExpires: { [Op.gt]: Date.now() },
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.isPhoneVerified = true;
    user.phoneVerificationOtp = null;
    user.phoneVerificationExpires = null;
    await user.save();

    res.json({ message: 'Phone verified successfully' });
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

    if (!user.isEmailVerified) {
      return res.status(403).json({ message: 'Email not verified' });
    }

    if (user.phone && !user.isPhoneVerified) {
      return res.status(403).json({ message: 'Phone not verified' });
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
    const accessToken = generateAccessToken(user, user.useRefreshTokens);
    let refreshToken;
    if (user.useRefreshTokens) {
      refreshToken = generateRefreshToken(user);
      await Session.create({
        UserId: user.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        deviceInfo: req.get('User-Agent'),
      });
    }
    await user.save();

    res.json({ 
      accessToken, 
      refreshToken: user.useRefreshTokens ? refreshToken : undefined,
      user: { 
        id: user.id, 
        firstName: user.firstName, 
        lastName: user.lastName, 
        email: user.email, 
        dateOfBirth: user.dateOfBirth, 
        phone: user.phone, 
        profilePicture: user.profilePicture, 
        role: user.Role.name,
        useRefreshTokens: user.useRefreshTokens 
      } 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  otpLogin,
  otpVerify,
  logout,
  getSessions,
  requestEmailVerification,
  verifyEmail,
  requestPhoneVerification,
  verifyPhone,
  requestPasswordReset,
  resetPassword,
  requestMagicLink,
  magicLinkLogin,
};