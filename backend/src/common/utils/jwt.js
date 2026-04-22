const jwt = require("jsonwebtoken");

const ACCESS_TOKEN_TTL = process.env.JWT_ACCESS_TTL || "15m";
const REFRESH_TOKEN_TTL = process.env.JWT_REFRESH_TTL || "7d";

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function signAccessToken(payload) {
  return jwt.sign(payload, getRequiredEnv("JWT_ACCESS_SECRET"), {
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, getRequiredEnv("JWT_REFRESH_SECRET"), {
    expiresIn: REFRESH_TOKEN_TTL,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, getRequiredEnv("JWT_ACCESS_SECRET"));
}

function verifyRefreshToken(token) {
  return jwt.verify(token, getRequiredEnv("JWT_REFRESH_SECRET"));
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
