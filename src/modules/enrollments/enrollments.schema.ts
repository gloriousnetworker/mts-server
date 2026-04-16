import { z } from 'zod';

export const enrollSchema = z.object({
  courseId: z.string().uuid('Invalid course ID'),
});

export type EnrollInput = z.infer<typeof enrollSchema>;
