import crypto from 'crypto';
import { prisma } from '../../config/database.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { generateTOTPSecret, verifyTOTPCode, generateQRCode } from '../../utils/totp.js';
import { ApiError } from '../../utils/api-error.js';
import type { JwtPayload } from '../../types/index.js';
import type {
  RegisterInput,
  LoginInput,
  VerifyLoginTwoFactorInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  EnableTwoFactorInput,
  DisableTwoFactorInput,
  ChangePasswordInput,
} from './auth.schema.js';

function buildTokens(payload: JwtPayload) {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

function sanitizeUser(user: { id: string; email: string; name: string; role: string; avatar: string | null; phone: string | null; twoFactorEnabled: boolean; createdAt: Date }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
    phone: user.phone,
    twoFactorEnabled: user.twoFactorEnabled,
    createdAt: user.createdAt,
  };
}

// ─── Register ────────────────────────────────────────────────
export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw ApiError.conflict('Email already registered');
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      phone: input.phone,
      role: 'student',
    },
  });

  const payload: JwtPayload = { id: user.id, email: user.email, role: user.role };
  const tokens = buildTokens(payload);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: tokens.refreshToken },
  });

  return { user: sanitizeUser(user), ...tokens };
}

// ─── Login ───────────────────────────────────────────────────
export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // If 2FA is enabled, return a flag — don't issue tokens yet
  if (user.twoFactorEnabled) {
    return { requiresTwoFactor: true, user: null, accessToken: null, refreshToken: null };
  }

  const payload: JwtPayload = { id: user.id, email: user.email, role: user.role };
  const tokens = buildTokens(payload);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: tokens.refreshToken },
  });

  return { requiresTwoFactor: false, user: sanitizeUser(user), ...tokens };
}

// ─── Verify 2FA during login ─────────────────────────────────
export async function verifyLoginTwoFactor(input: VerifyLoginTwoFactorInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const validPassword = await comparePassword(input.password, user.passwordHash);
  if (!validPassword) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    throw ApiError.badRequest('2FA is not enabled for this account');
  }

  const validCode = verifyTOTPCode(user.twoFactorSecret, input.twoFactorCode);
  if (!validCode) {
    throw ApiError.unauthorized('Invalid 2FA code');
  }

  const payload: JwtPayload = { id: user.id, email: user.email, role: user.role };
  const tokens = buildTokens(payload);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: tokens.refreshToken },
  });

  return { user: sanitizeUser(user), ...tokens };
}

// ─── Refresh Tokens ──────────────────────────────────────────
export async function refresh(refreshTokenValue: string) {
  let payload: JwtPayload;
  try {
    payload = verifyRefreshToken(refreshTokenValue);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user || user.refreshToken !== refreshTokenValue) {
    throw ApiError.unauthorized('Refresh token revoked');
  }

  const newPayload: JwtPayload = { id: user.id, email: user.email, role: user.role };
  const tokens = buildTokens(newPayload);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: tokens.refreshToken },
  });

  return { user: sanitizeUser(user), ...tokens };
}

// ─── Logout ──────────────────────────────────────────────────
export async function logout(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });
}

// ─── Get Current User ────────────────────────────────────────
export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return sanitizeUser(user);
}

// ─── Change Password ─────────────────────────────────────────
export async function changePassword(userId: string, input: ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const valid = await comparePassword(input.currentPassword, user.passwordHash);
  if (!valid) {
    throw ApiError.unauthorized('Current password is incorrect');
  }

  const passwordHash = await hashPassword(input.newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

// ─── Forgot Password ────────────────────────────────────────
export async function forgotPassword(input: ForgotPasswordInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Always return success to prevent email enumeration
  if (!user) return;

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExp },
  });

  // TODO: Send email with reset link containing the token
  // For now, return the token in dev mode for testing
  return { resetToken };
}

// ─── Reset Password ─────────────────────────────────────────
export async function resetPassword(input: ResetPasswordInput) {
  const user = await prisma.user.findFirst({
    where: {
      resetToken: input.token,
      resetTokenExp: { gte: new Date() },
    },
  });

  if (!user) {
    throw ApiError.badRequest('Invalid or expired reset token');
  }

  const passwordHash = await hashPassword(input.password);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExp: null,
      refreshToken: null, // invalidate all sessions
    },
  });
}

// ─── 2FA: Generate Setup ────────────────────────────────────
export async function setupTwoFactor(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (user.twoFactorEnabled) {
    throw ApiError.badRequest('2FA is already enabled');
  }

  const { secret, uri } = generateTOTPSecret(user.email);
  const qrCode = await generateQRCode(uri);

  // Store secret temporarily (not enabled until verified)
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secret },
  });

  return { secret, qrCode };
}

// ─── 2FA: Enable (verify code to confirm) ───────────────────
export async function enableTwoFactor(userId: string, input: EnableTwoFactorInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (user.twoFactorEnabled) {
    throw ApiError.badRequest('2FA is already enabled');
  }

  if (!user.twoFactorSecret) {
    throw ApiError.badRequest('Call /auth/2fa/setup first');
  }

  const valid = verifyTOTPCode(user.twoFactorSecret, input.code);
  if (!valid) {
    throw ApiError.badRequest('Invalid 2FA code — scan the QR code and try again');
  }

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: true },
  });

  return { message: '2FA enabled successfully' };
}

// ─── 2FA: Disable ───────────────────────────────────────────
export async function disableTwoFactor(userId: string, input: DisableTwoFactorInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    throw ApiError.badRequest('2FA is not enabled');
  }

  const valid = verifyTOTPCode(user.twoFactorSecret, input.code);
  if (!valid) {
    throw ApiError.unauthorized('Invalid 2FA code');
  }

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });

  return { message: '2FA disabled successfully' };
}
