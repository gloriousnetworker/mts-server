import { Router } from 'express';
import * as galleryController from './gallery.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { addGalleryItemSchema, galleryIdParamSchema } from './gallery.schema.js';

const router = Router();

/**
 * @openapi
 * /gallery:
 *   get:
 *     summary: List all gallery items
 *     tags: [Gallery]
 *     description: Public endpoint. Returns images and videos organized by category.
 *     responses:
 *       200:
 *         description: Array of gallery items
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
 *                     $ref: '#/components/schemas/GalleryItem'
 */
router.get('/', galleryController.listItems);

/**
 * @openapi
 * /gallery:
 *   post:
 *     summary: Add a gallery item
 *     tags: [Gallery]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     description: Staff or admin only.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, category, url]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Training Session 2026
 *               category:
 *                 type: string
 *                 enum: [trainings, workshops, events, graduation, conferences]
 *               type:
 *                 type: string
 *                 enum: [image, video]
 *                 default: image
 *               url:
 *                 type: string
 *                 example: https://example.com/photo.jpg
 *               thumbnail:
 *                 type: string
 *     responses:
 *       201:
 *         description: Gallery item added
 */
router.post('/', authenticate, authorize('staff', 'admin'), validate(addGalleryItemSchema), galleryController.addItem);

/**
 * @openapi
 * /gallery/{id}:
 *   delete:
 *     summary: Delete a gallery item
 *     tags: [Gallery]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     description: Admin only.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Gallery item deleted
 *       404:
 *         description: Gallery item not found
 */
router.delete('/:id', authenticate, authorize('admin'), validate(galleryIdParamSchema, 'params'), galleryController.deleteItem);

export default router;
