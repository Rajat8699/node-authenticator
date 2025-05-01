const { v4: uuidv4 } = require('uuid');
const User = require('../models/user');
const { hashPassword } = require('../utils/password');
const { sendEmail } = require('./emailService');

const generateResetToken = async (user) => {
  const token = uuidv4();
  user.resetToken = token;
  user.resetTokenExpires = Date.now() + 3600000; // 1 hour
  await user.save();
  return token;
};

const generateMagicLink = async (user) => {
  const token = uuidv4();
  user.magicToken = token;
  user.magicTokenExpires = Date.now() + 3600000; // 1 hour
  await user.save();
  return token;
};

const sendResetPasswordEmail = async (user) => {
  const token = await generateResetToken(user);
  const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  await sendEmail(
    user.email,
    'Password Reset Request',
    `Click here to reset your password: <a href="${resetLink}">${resetLink}</a>`
  );
};

const sendMagicLinkEmail = async (user) => {
  const token = await generateMagicLink(user);
  const magicLink = `${process.env.FRONTEND_URL}/magic-login/${token}`;
  await sendEmail(
    user.email,
    'Magic Link Login',
    `Click here to login: <a href="${magicLink}">${magicLink}</a>`
  );
};

module.exports = {
  sendResetPasswordEmail,
  sendMagicLinkEmail,
};