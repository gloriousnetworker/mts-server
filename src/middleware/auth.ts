import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { ApiError } from '../utils/api-error.js';

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  // Try cookie first, then Authorization header as fallback
  const token =
    req.cookies?.access_token ||
    req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return next(ApiError.unauthorized('No token provided'));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.id, email: payload.email, role: payload.role };
    next();
  } catch {
    return next(ApiError.unauthorized('Invalid or expired token'));
  }
}
