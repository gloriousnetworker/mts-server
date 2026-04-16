import { env } from '../config/env.js';
import crypto from 'crypto';

const PAYSTACK_BASE = 'https://api.paystack.co';

async function paystackRequest(method: string, path: string, body?: unknown) {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json() as Promise<any>;
}

/**
 * Initialize a Paystack transaction.
 * Returns authorization_url for the user to complete payment.
 */
export async function initializeTransaction(params: {
  email: string;
  amount: number; // in kobo (NGN smallest unit) — multiply naira by 100
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}) {
  return paystackRequest('POST', '/transaction/initialize', {
    email: params.email,
    amount: params.amount,
    reference: params.reference,
    callback_url: params.callbackUrl,
    metadata: params.metadata,
  });
}

/**
 * Verify a Paystack transaction by reference.
 */
export async function verifyTransaction(reference: string) {
  return paystackRequest('GET', `/transaction/verify/${encodeURIComponent(reference)}`);
}

/**
 * Validate Paystack webhook signature.
 */
export function validateWebhookSignature(body: string, signature: string): boolean {
  if (!env.PAYSTACK_SECRET_KEY) return false;
  const hash = crypto
    .createHmac('sha512', env.PAYSTACK_SECRET_KEY)
    .update(body)
    .digest('hex');
  return hash === signature;
}

/**
 * Generate a unique payment reference.
 */
export function generateReference(): string {
  return `MTS-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}
