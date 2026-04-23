const authService = require("./auth.service");
const { HttpError } = require("../../common/errors/http-error");
const DEFAULT_ACCESS_TOKEN_EXPIRES_IN = 15 * 60;

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
  };
}

function ensureBodyObject(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "Request body must be a JSON object");
  }
}

function validateRegisterBody(body) {
  ensureBodyObject(body);
  const requiredFields = ["email", "password", "firstName", "lastName"];
  for (const field of requiredFields) {
    if (!body[field] || typeof body[field] !== "string") {
      throw new HttpError(400, `Field '${field}' is required`);
    }
  }

  if (body.password.length < 8) {
    throw new HttpError(400, "Password must be at least 8 characters long");
  }
}

function validateLoginBody(body) {
  ensureBodyObject(body);
  if (!body.email || !body.password) {
    throw new HttpError(400, "Email and password are required");
  }
}

function validateRefreshBody(body) {
  ensureBodyObject(body);
  if (!body.refreshToken || typeof body.refreshToken !== "string") {
    throw new HttpError(400, "Field 'refreshToken' is required");
  }
}

function validateLogoutBody(body) {
  if (body === undefined) {
    return;
  }
  ensureBodyObject(body);
  if (body.refreshToken !== undefined && typeof body.refreshToken !== "string") {
    throw new HttpError(400, "Field 'refreshToken' must be a string");
  }
}

function getAccessTokenTtlSeconds() {
  const raw = process.env.JWT_ACCESS_TTL || "15m";
  const match = /^(\d+)([smhd])$/.exec(raw);
  if (!match) {
    return DEFAULT_ACCESS_TOKEN_EXPIRES_IN;
  }

  const value = Number(match[1]);
  const unit = match[2];
  const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
  return value * multipliers[unit];
}

async function register(req, res, next) {
  try {
    validateRegisterBody(req.body);
    const result = await authService.register(req.body);
    res.status(200).json({
      userId: result.user.id,
      message: "User registered successfully",
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    validateLoginBody(req.body);
    const result = await authService.login(req.body);
    res.status(200).json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: getAccessTokenTtlSeconds(),
      user: sanitizeUser(result.user),
    });
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    validateRefreshBody(req.body);
    const result = await authService.refresh(req.body.refreshToken);
    res.status(200).json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: getAccessTokenTtlSeconds(),
      user: sanitizeUser(result.user),
    });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    validateLogoutBody(req.body);
    await authService.logout(req.auth.userId, req.body?.refreshToken);
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, refresh, logout };
