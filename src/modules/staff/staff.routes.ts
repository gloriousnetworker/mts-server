import { Router } from 'express';
import * as staffController from './staff.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createStaffSchema } from './staff.schema.js';

const router = Router();

/**
 * @openapi
 * /staff:
 *   get:
 *     summary: List all staff members
 *     tags: [Staff]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     description: Returns staff users with their profiles (position, bio, skills, social). Admin only for management; public staff page uses a separate endpoint.
 *     responses:
 *       200:
 *         description: Array of staff members
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
 *                     $ref: '#/components/schemas/Staff'
 */
router.get('/', authenticate, authorize('admin'), staffController.listStaff);

/**
 * @openapi
 * /staff/public:
 *   get:
 *     summary: List staff for public staff page
 *     tags: [Staff]
 *     description: Public endpoint. Returns staff profiles for the website staff directory.
 *     responses:
 *       200:
 *         description: Array of staff members
 */
router.get('/public', staffController.listStaff);

/**
 * @openapi
 * /staff:
 *   post:
 *     summary: Create a new staff member
 *     tags: [Staff]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     description: Admin only. Creates a user with role=staff and a StaffProfile.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, position]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Dr. Aisha Babangida
 *               email:
 *                 type: string
 *                 format: email
 *                 example: a.babangida@megatech.com
 *               password:
 *                 type: string
 *                 example: Password1
 *               phone:
 *                 type: string
 *               position:
 *                 type: string
 *                 example: Data Science Lead
 *               bio:
 *                 type: string
 *               photo:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Python", "TensorFlow", "Machine Learning"]
 *               social:
 *                 type: object
 *                 properties:
 *                   linkedin:
 *                     type: string
 *                   twitter:
 *                     type: string
 *                   github:
 *                     type: string
 *     responses:
 *       201:
 *         description: Staff member created
 *       409:
 *         description: Email already registered
 */
router.post('/', authenticate, authorize('admin'), validate(createStaffSchema), staffController.createStaff);

router.put('/:id', authenticate, authorize('admin'), staffController.updateStaff);

router.delete('/:id', authenticate, authorize('admin'), staffController.deleteStaff);

export default router;
