const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');
const { generateToken } = require('../utils/jwt');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/password/reset', authController.requestPasswordReset);
router.post('/password/reset/:token', authController.resetPassword);
router.post('/magic-link', authController.requestMagicLink);
router.get('/magic-link/:token', authController.magicLinkLogin);
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    const token = generateToken(req.user);
    res.redirect(`${process.env.FRONTEND_URL}/auth?token=${token}`);
  }
);

module.exports = router;