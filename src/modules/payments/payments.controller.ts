import { Request, Response, NextFunction } from 'express';
import * as paymentsService from './payments.service.js';
import { sendSuccess } from '../../utils/api-response.js';
import { validateWebhookSignature } from '../../utils/paystack.js';

export async function initializePayment(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await paymentsService.initializePayment(req.user!.id, req.user!.email, req.body);
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function verifyPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await paymentsService.verifyPayment(req.params.reference as string);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function paystackWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const signature = req.headers['x-paystack-signature'] as string;
    const rawBody = JSON.stringify(req.body);

    if (!signature || !validateWebhookSignature(rawBody, signature)) {
      return res.status(400).send('Invalid signature');
    }

    const { event, data } = req.body;
    await paymentsService.handleWebhook(event, data);

    // Paystack expects 200 response
    res.status(200).send('OK');
  } catch (err) {
    next(err);
  }
}

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
