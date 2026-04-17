import { prisma } from '../../config/database.js';
import { ApiError } from '../../utils/api-error.js';
import type { CreateBlogPostInput } from './blog.schema.js';

function formatPost(post: any) {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    excerpt: post.excerpt,
    author: post.author,
    date: post.date,
    category: post.category,
    image: post.image,
    tags: post.tags,
  };
}

export async function listPosts() {
  const posts = await prisma.blogPost.findMany({ orderBy: { date: 'desc' } });
  return posts.map(formatPost);
}

export async function createPost(input: CreateBlogPostInput, authorName: string) {
  const post = await prisma.blogPost.create({
    data: {
      ...input,
      author: authorName,
    },
  });
  return formatPost(post);
}

export async function updatePost(id: string, input: Partial<CreateBlogPostInput>) {
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Blog post not found');

  const post = await prisma.blogPost.update({ where: { id }, data: input });
  return formatPost(post);
}

export async function deletePost(id: string) {
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Blog post not found');

  await prisma.blogPost.delete({ where: { id } });
}
