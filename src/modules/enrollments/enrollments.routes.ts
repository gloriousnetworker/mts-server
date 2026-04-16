import { Router } from 'express';
import * as enrollmentsController from './enrollments.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { enrollSchema } from './enrollments.schema.js';

const router = Router();

/**
 * @openapi
 * /enrollments:
 *   post:
 *     summary: Enroll in a course
 *     tags: [Enrollments]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     description: Student only. Creates enrollment and increments the course's enrolled student count.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courseId]
 *             properties:
 *               courseId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Enrollment created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Enrollment'
 *       404:
 *         description: Course not found
 *       409:
 *         description: Already enrolled
 */
router.post('/', authenticate, authorize('student'), validate(enrollSchema), enrollmentsController.enroll);

/**
 * @openapi
 * /enrollments/my:
 *   get:
 *     summary: Get my enrollments
 *     tags: [Enrollments]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     description: Student only. Returns enrollments with full course data included.
 *     responses:
 *       200:
 *         description: Array of enrollments with nested course data
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
 *                     $ref: '#/components/schemas/Enrollment'
 */
router.get('/my', authenticate, authorize('student'), enrollmentsController.getMyEnrollments);

export default router;
