const jwt = require('jsonwebtoken');

// In-memory blacklist (in production, use Redis or database)
const blacklistedTokens = new Set();

const signAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'default_jwt_secret_key_for_testing', { expiresIn: '24h' });
};

const signRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'default_refresh_jwt_secret_key_for_testing', { expiresIn: '7d' });
};

const verifyAccessToken = (token) => {
  if (blacklistedTokens.has(token)) {
    throw new Error('Token has been blacklisted');
  }
  return jwt.verify(token, process.env.JWT_SECRET);
};

const verifyRefreshToken = (token) => {
  if (blacklistedTokens.has(token)) {
    throw new Error('Token has been blacklisted');
  }
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

const blacklistToken = (token) => {
  blacklistedTokens.add(token);
  // Clean up expired tokens periodically (in production, use a proper cleanup mechanism)
  setTimeout(() => {
    blacklistedTokens.delete(token);
  }, 15 * 60 * 1000); // 15 minutes for access tokens
};

const blacklistRefreshToken = (token) => {
  blacklistedTokens.add(token);
  // Clean up expired refresh tokens
  setTimeout(() => {
    blacklistedTokens.delete(token);
  }, 7 * 24 * 60 * 60 * 1000); // 7 days for refresh tokens
};

module.exports = { 
  signAccessToken, 
  signRefreshToken, 
  verifyAccessToken, 
  verifyRefreshToken,
  blacklistToken,
  blacklistRefreshToken,
  jwt 
};
