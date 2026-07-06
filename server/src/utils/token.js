const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/env');

function generateAccessToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, tokenType: 'access' },
    jwtConfig.accessSecret,
    { expiresIn: jwtConfig.accessExpires }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user._id, tokenType: 'refresh' },
    jwtConfig.refreshSecret,
    { expiresIn: jwtConfig.refreshExpires }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, jwtConfig.accessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, jwtConfig.refreshSecret);
}

/**
 * Sets the refresh token as a secure, httpOnly cookie.
 * Access token is returned in the JSON body (kept in memory on the client),
 * refresh token never touches client-side JS.
 */
function setRefreshTokenCookie(res, token) {
  const { isProd } = require('../config/env');
  res.cookie(jwtConfig.cookieName, token, {
    httpOnly: true,
    secure: isProd, // HTTPS only in production
    // 'none' is required (with secure:true) when the frontend and API are
    // deployed on different origins/domains, which is the common production
    // setup (e.g. a Vercel/Netlify frontend calling a Render/Railway API).
    // 'strict' would silently block the cookie on every cross-site request
    // and break the whole silent-refresh flow, so we only use it if the
    // deployer explicitly opts in via COOKIE_SAME_SITE.
    sameSite: isProd ? process.env.COOKIE_SAME_SITE || 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/api/v1/auth',
  });
}

function clearRefreshTokenCookie(res) {
  res.clearCookie(jwtConfig.cookieName, { path: '/api/v1/auth' });
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
};
