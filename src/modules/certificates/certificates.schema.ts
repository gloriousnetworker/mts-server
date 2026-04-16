import { z } from 'zod';

export const issueCertificateSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  courseId: z.string().uuid('Invalid course ID'),
});

export const verifyParamSchema = z.object({
  id: z.string().min(1, 'Certificate ID or number required'),
});

export type IssueCertificateInput = z.infer<typeof issueCertificateSchema>;
