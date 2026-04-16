import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error.js';
import { sendError } from '../utils/api-response.js';
import { logger } from '../config/logger.js';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return sendError(res, err.message, err.statusCode, err.code);
  }

  logger.error(err, 'Unhandled error');
  const message = process.env.NODE_ENV !== 'production' ? err.message : 'Internal server error';
  return sendError(res, message, 500, 'INTERNAL_ERROR');
}
