import { z } from 'zod';

export const createPaymentSchema = z.object({
  courseId: z.string().uuid('Invalid course ID'),
  amount: z.number().positive('Amount must be positive'),
  method: z.string().min(1, 'Payment method is required'),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
