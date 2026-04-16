import { prisma } from '../../config/database.js';
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
