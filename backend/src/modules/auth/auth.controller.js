const authService = require("./auth.service");
const { HttpError } = require("../../common/errors/http-error");

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

function validateRegisterBody(body) {
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
  if (!body.email || !body.password) {
    throw new HttpError(400, "Email and password are required");
  }
}

async function register(req, res, next) {
  try {
    validateRegisterBody(req.body);
    const result = await authService.register(req.body);
    res.status(201).json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: sanitizeUser(result.user),
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
      user: sanitizeUser(result.user),
    });
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const result = await authService.refresh(req.body.refreshToken);
    res.status(200).json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: sanitizeUser(result.user),
    });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    await authService.logout(req.auth.userId, req.body.refreshToken);
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, refresh, logout };
