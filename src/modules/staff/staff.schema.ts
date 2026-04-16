import { z } from 'zod';

export const createStaffSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number'),
  phone: z.string().optional(),
  position: z.string().min(1, 'Position is required'),
  bio: z.string().optional().default(''),
  photo: z.string().optional().default(''),
  skills: z.array(z.string()).optional().default([]),
  social: z.object({
    linkedin: z.string().optional(),
    twitter: z.string().optional(),
    github: z.string().optional(),
  }).optional(),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
