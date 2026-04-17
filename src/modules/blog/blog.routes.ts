import { Router } from 'express';
import * as blogController from './blog.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createBlogPostSchema } from './blog.schema.js';

const router = Router();

/**
 * @openapi
 * /blog:
 *   get:
 *     summary: List all blog posts
 *     tags: [Blog]
 *     description: Public endpoint. Returns all blog posts ordered by date.
 *     responses:
 *       200:
 *         description: Array of blog posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BlogPost'
 */
router.get('/', blogController.listPosts);

/**
 * @openapi
 * /blog:
 *   post:
 *     summary: Create a blog post
 *     tags: [Blog]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     description: Staff or admin only. Author name is taken from the authenticated user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content, excerpt, category]
 *             properties:
 *               title:
 *                 type: string
 *                 example: The Future of AI in Education
 *               content:
 *                 type: string
 *                 example: Full article content here...
 *               excerpt:
 *                 type: string
 *                 example: Discover how AI is transforming learning
 *               category:
 *                 type: string
 *                 example: Tech Updates
 *               image:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["AI", "Education"]
 *     responses:
 *       201:
 *         description: Blog post created
 */
router.post('/', authenticate, authorize('staff', 'admin'), validate(createBlogPostSchema), blogController.createPost);

router.put('/:id', authenticate, authorize('staff', 'admin'), blogController.updatePost);

router.delete('/:id', authenticate, authorize('admin'), blogController.deletePost);

export default router;
