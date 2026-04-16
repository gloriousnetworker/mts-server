import { Request, Response, NextFunction } from 'express';
import * as paymentsService from './payments.service.js';
import { sendSuccess } from '../../utils/api-response.js';

export async function createPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const payment = await paymentsService.createPayment(req.user!.id, req.body);
    sendSuccess(res, payment, 201);
  } catch (err) {
    next(err);
  }
}

export async function getMyPayments(req: Request, res: Response, next: NextFunction) {
  try {
    const payments = await paymentsService.getMyPayments(req.user!.id);
    sendSuccess(res, payments);
  } catch (err) {
    next(err);
  }
}

export async function getAllPayments(_req: Request, res: Response, next: NextFunction) {
  try {
    const payments = await paymentsService.getAllPayments();
    sendSuccess(res, payments);
  } catch (err) {
    next(err);
  }
}
