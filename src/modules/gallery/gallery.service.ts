import { prisma } from '../../config/database.js';
import { ApiError } from '../../utils/api-error.js';
import type { AddGalleryItemInput } from './gallery.schema.js';

function formatItem(item: any) {
  return {
    id: item.id,
    title: item.title,
    category: item.category,
    type: item.type,
    url: item.url,
    thumbnail: item.thumbnail,
    date: item.date,
  };
}

export async function listItems() {
  const items = await prisma.galleryItem.findMany({ orderBy: { date: 'desc' } });
  return items.map(formatItem);
}

export async function addItem(input: AddGalleryItemInput) {
  const item = await prisma.galleryItem.create({ data: input });
  return formatItem(item);
}

export async function deleteItem(id: string) {
  const existing = await prisma.galleryItem.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound('Gallery item not found');
  }
  await prisma.galleryItem.delete({ where: { id } });
}
