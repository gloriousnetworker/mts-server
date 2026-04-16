import { Request, Response, NextFunction } from 'express';
import * as statsService from './stats.service.js';
import { sendSuccess } from '../../utils/api-response.js';

export async function getDashboardStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await statsService.getDashboardStats();
    sendSuccess(res, stats);
  } catch (err) {
    next(err);
  }
}
