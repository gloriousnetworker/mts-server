import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service.js';
import { sendSuccess } from '../../utils/api-response.js';
import { setAuthCookies, clearAuthCookies } from '../../utils/cookies.js';
import { ApiError } from '../../utils/api-error.js';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.register(req.body);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    sendSuccess(res, { user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken }, 201);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.login(req.body);

    if (result.requiresTwoFactor) {
      return sendSuccess(res, { requiresTwoFactor: true, message: 'Please provide your 2FA code' });
    }

    setAuthCookies(res, result.accessToken!, result.refreshToken!);
    sendSuccess(res, { user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken });
  } catch (err) {
    next(err);
  }
}

export async function verifyLoginTwoFactor(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.verifyLoginTwoFactor(req.body);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    sendSuccess(res, { user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken });
  } catch (err) {
    next(err);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refresh_token || req.body?.refreshToken;
    if (!token) {
      throw ApiError.unauthorized('No refresh token provided');
    }

    const result = await authService.refresh(token);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    sendSuccess(res, { user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user) {
      await authService.logout(req.user.id);
    }
    clearAuthCookies(res);
    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getMe(req.user!.id);
    sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.changePassword(req.user!.id, req.body);
    sendSuccess(res, { message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.forgotPassword(req.body);
    const data: Record<string, string> = { message: 'If the email exists, a reset link has been sent' };
    if (process.env.NODE_ENV !== 'production' && result?.resetToken) {
      data.resetToken = result.resetToken;
    }
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.resetPassword(req.body);
    clearAuthCookies(res);
    sendSuccess(res, { message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
}

export async function setupTwoFactor(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.setupTwoFactor(req.user!.id);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function enableTwoFactor(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.enableTwoFactor(req.user!.id, req.body);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function disableTwoFactor(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.disableTwoFactor(req.user!.id, req.body);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
