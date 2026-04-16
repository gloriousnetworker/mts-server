import { Request, Response } from 'express';
import { sendError } from '../utils/api-response.js';

export function notFoundHandler(_req: Request, res: Response) {
  sendError(res, 'Route not found', 404, 'NOT_FOUND');
}
