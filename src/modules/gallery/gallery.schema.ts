import { z } from 'zod';

export const addGalleryItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.enum(['trainings', 'workshops', 'events', 'graduation', 'conferences']),
  type: z.enum(['image', 'video']).optional().default('image'),
  url: z.string().min(1, 'URL is required'),
  thumbnail: z.string().optional(),
});

export const galleryIdParamSchema = z.object({
  id: z.string().uuid('Invalid gallery item ID'),
});

export type AddGalleryItemInput = z.infer<typeof addGalleryItemSchema>;
