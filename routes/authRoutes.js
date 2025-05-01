const express = require('express');
const router = express.Router();
const passport = require('passport');
const { Op } = require('sequelize');
const authController = require('../controllers/authController');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../utils/jwt');
const Session = require('../models/session');
const { authenticate } = require('../middlewares/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/otp-login', authController.otpLogin);
router.post('/otp-verify', authController.otpVerify);
router.post('/logout', authenticate, authController.logout);
router.get('/sessions', authenticate, authController.getSessions);
router.post('/email/verify', authController.requestEmailVerification);
router.get('/email/verify/:token', authController.verifyEmail);
router.post('/phone/verify', authController.requestPhoneVerification);
router.post('/phone/verify/:otp', authController.verifyPhone);
router.post('/password/reset', authController.requestPasswordReset);
router.post('/password/reset/:token', authController.resetPassword);
router.post('/magic-link', authController.requestMagicLink);
router.get('/magic-link/:token', authController.magicLinkLogin);
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
    const accessToken = generateAccessToken(req.user, req.user.useRefreshTokens);
    let refreshToken;
    if (req.user.useRefreshTokens) {
      refreshToken = generateRefreshToken(req.user);
      await Session.create({
        UserId: req.user.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        deviceInfo: req.get('User-Agent'),
      });
    }
    res.redirect(`${process.env.FRONTEND_URL}/auth?accessToken=${accessToken}${req.user.useRefreshTokens ? `&refreshToken=${refreshToken}` : ''}`);
  }
);

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token required' });
  }

  try {
    const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
    const session = await Session.findOne({
      where: {
        refreshToken,
        expiresAt: { [Op.gt]: Date.now() },
      },
      include: [{ model: User, include: [Role] }],
    });

    if (!session || !session.User || !session.User.useRefreshTokens) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    const user = session.User;
    const newAccessToken = generateAccessToken(user, true);
    const newRefreshToken = generateRefreshToken(user);
    session.refreshToken = newRefreshToken;
    session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await session.save();

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

module.exports = router;