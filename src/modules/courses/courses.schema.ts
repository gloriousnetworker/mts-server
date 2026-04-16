import { z } from 'zod';

export const createCourseSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().min(0, 'Price must be non-negative'),
  category: z.string().min(1, 'Category is required'),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  duration: z.string().min(1, 'Duration is required'),
  image: z.string().optional().default(''),
  curriculum: z.array(z.string()).optional().default([]),
  requirements: z.array(z.string()).optional().default([]),
  learningOutcomes: z.array(z.string()).optional().default([]),
  isFeatured: z.boolean().optional().default(false),
});

export const updateCourseSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  price: z.number().min(0).optional(),
  category: z.string().min(1).optional(),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
  duration: z.string().min(1).optional(),
  image: z.string().optional(),
  curriculum: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  learningOutcomes: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
  rating: z.number().min(0).max(5).optional(),
});

export const courseIdParamSchema = z.object({
  id: z.string().uuid('Invalid course ID'),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
