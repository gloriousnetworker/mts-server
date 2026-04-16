import { z } from 'zod';

export const submitAssignmentSchema = z.object({
  courseId: z.string().uuid('Invalid course ID'),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional().default(''),
  fileUrl: z.string().optional(),
});

export type SubmitAssignmentInput = z.infer<typeof submitAssignmentSchema>;
