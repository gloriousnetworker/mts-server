import { z } from 'zod';

export const updateStudentSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
});

export const studentIdParamSchema = z.object({
  id: z.string().uuid('Invalid student ID'),
});

export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
