const { verifyAccessToken } = require("../utils/jwt");
const { HttpError } = require("../errors/http-error");

function extractBearerToken(headerValue) {
  if (!headerValue) {
    return null;
  }

  const [scheme, token] = headerValue.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

function authenticate(req, res, next) {
  try {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      throw new HttpError(401, "Access token is missing");
    }

    const decoded = verifyAccessToken(token);
    req.auth = {
      userId: decoded.sub,
      role: decoded.role,
      email: decoded.email,
    };
    next();
  } catch (error) {
    if (error instanceof HttpError) {
      return next(error);
    }
    return next(new HttpError(401, "Invalid or expired access token"));
  }
}

module.exports = { authenticate };
