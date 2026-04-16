import { z } from 'zod';

export const initializePaymentSchema = z.object({
  courseId: z.string().uuid('Invalid course ID'),
  callbackUrl: z.string().url().optional(),
});

export const createPaymentSchema = z.object({
  courseId: z.string().uuid('Invalid course ID'),
  amount: z.number().positive('Amount must be positive'),
  method: z.string().min(1, 'Payment method is required'),
});

export const verifyPaymentParamSchema = z.object({
  reference: z.string().min(1, 'Reference is required'),
});

export type InitializePaymentInput = z.infer<typeof initializePaymentSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
