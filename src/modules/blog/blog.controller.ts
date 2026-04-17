import { Request, Response, NextFunction } from 'express';
import * as blogService from './blog.service.js';
import { sendSuccess } from '../../utils/api-response.js';
import { prisma } from '../../config/database.js';

export async function listPosts(_req: Request, res: Response, next: NextFunction) {
  try {
    const posts = await blogService.listPosts();
    sendSuccess(res, posts);
  } catch (err) {
    next(err);
  }
}

export async function createPost(req: Request, res: Response, next: NextFunction) {
  try {
    // Get author name from authenticated user
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { name: true } });
    const post = await blogService.createPost(req.body, user?.name ?? 'Unknown');
    sendSuccess(res, post, 201);
  } catch (err) {
    next(err);
  }
}

export async function updatePost(req: Request, res: Response, next: NextFunction) {
  try {
    const post = await blogService.updatePost(req.params.id as string, req.body);
    sendSuccess(res, post);
  } catch (err) {
    next(err);
  }
}

export async function deletePost(req: Request, res: Response, next: NextFunction) {
  try {
    await blogService.deletePost(req.params.id as string);
    sendSuccess(res, { message: 'Blog post deleted successfully' });
  } catch (err) {
    next(err);
  }
}
