const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const { prisma } = require("../../database/client");
const { HttpError } = require("../../common/errors/http-error");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../../common/utils/jwt");

const SALT_ROUNDS = 10;

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function parseJwtExpiry(token) {
  const [, payloadBase64] = token.split(".");
  const payload = JSON.parse(Buffer.from(payloadBase64, "base64").toString("utf-8"));
  return new Date(payload.exp * 1000);
}

async function issueTokens(user) {
  const payload = { sub: user.id, role: user.role, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: parseJwtExpiry(refreshToken),
    },
  });

  return { accessToken, refreshToken };
}

async function register(input) {
  const { email, password, firstName, lastName, phone } = input;
  const role = input.role === "organizer" ? "organizer" : "client";
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    throw new HttpError(409, "User with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone || null,
      role,
      ...(role === "organizer"
        ? {
            organizerProfile: {
              create: {
                verified: false,
              },
            },
          }
        : {}),
    },
  });

  const tokens = await issueTokens(user);
  return { user, ...tokens };
}

async function login(input) {
  const { email, password } = input;
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    throw new HttpError(401, "Invalid credentials");
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new HttpError(401, "Invalid credentials");
  }

  const tokens = await issueTokens(user);
  return { user, ...tokens };
}

async function refresh(refreshToken) {
  if (!refreshToken) {
    throw new HttpError(400, "Refresh token is required");
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new HttpError(401, "Invalid or expired refresh token");
  }

  const tokenHash = hashToken(refreshToken);
  const existing = await prisma.refreshToken.findFirst({
    where: {
      userId: decoded.sub,
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!existing) {
    throw new HttpError(401, "Refresh token is not active");
  }

  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date() },
  });

  const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
  if (!user) {
    throw new HttpError(401, "User not found");
  }

  const tokens = await issueTokens(user);
  return { user, ...tokens };
}

async function logout(userId, refreshToken) {
  const where = { userId, revokedAt: null };
  if (refreshToken) {
    where.tokenHash = hashToken(refreshToken);
  }

  await prisma.refreshToken.updateMany({
    where,
    data: { revokedAt: new Date() },
  });
}

module.exports = { register, login, refresh, logout };
