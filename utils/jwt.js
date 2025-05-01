const jwt = require('jsonwebtoken');

const generateAccessToken = (user, useRefreshTokens) => {
  const expiresIn = useRefreshTokens ? '15m' : '1d'; // 15 min with refresh tokens, 1 day without
  return jwt.sign(
    { id: user.id, role: user.Role.name },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' } // 7-day refresh token
  );
};

const verifyToken = (token, secret) => {
  return jwt.verify(token, secret);
};

module.exports = { generateAccessToken, generateRefreshToken, verifyToken };