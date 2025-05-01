const { v4: uuidv4 } = require('uuid');
const User = require('../models/user');
const { hashPassword, generateOtp } = require('../utils/password');
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

const generateEmailVerificationToken = async (user) => {
  const token = uuidv4();
  user.emailVerificationToken = token;
  user.emailVerificationExpires = Date.now() + 24 * 3600000; // 24 hours
  await user.save();
  return token;
};

const generateLoginOtp = async (user) => {
  const otp = generateOtp();
  user.loginOtp = otp;
  user.loginOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();
  return otp;
};

const generatePhoneVerificationOtp = async (user) => {
  const otp = generateOtp();
  user.phoneVerificationOtp = otp;
  user.phoneVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();
  return otp;
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

const sendEmailVerificationEmail = async (user) => {
  const token = await generateEmailVerificationToken(user);
  const verifyLink = `${process.env.FRONTEND_URL}/verify-email/${token}`;
  await sendEmail(
    user.email,
    'Verify Your Email',
    `Click here to verify your email: <a href="${verifyLink}">${verifyLink}</a>`
  );
};

const sendLoginOtpEmail = async (user) => {
  const otp = await generateLoginOtp(user);
  await sendEmail(
    user.email,
    'Your OTP for Login',
    `Your one-time password (OTP) is: <strong>${otp}</strong>. It is valid for 10 minutes.`
  );
};

const sendPhoneVerificationOtp = async (user) => {
  const otp = await generatePhoneVerificationOtp(user);
  // Placeholder for SMS service (e.g., Twilio)
  console.log(`Sending OTP ${otp} to ${user.phone}`);
  // Replace with actual SMS provider integration
  // Example: await twilio.messages.create({ to: user.phone, from: 'YOUR_TWILIO_NUMBER', body: `Your OTP is ${otp}` });
};

module.exports = {
  sendResetPasswordEmail,
  sendMagicLinkEmail,
  sendEmailVerificationEmail,
  sendLoginOtpEmail,
  sendPhoneVerificationOtp,
};