import { z } from 'zod';

export const createBlogPostSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  excerpt: z.string().min(5, 'Excerpt must be at least 5 characters'),
  category: z.string().min(1, 'Category is required'),
  image: z.string().optional().default(''),
  tags: z.array(z.string()).optional().default([]),
});

export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;
