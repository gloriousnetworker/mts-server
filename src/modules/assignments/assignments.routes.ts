import { Router } from 'express';
import * as assignmentsController from './assignments.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { submitAssignmentSchema } from './assignments.schema.js';

const router = Router();

/**
 * @openapi
 * /assignments:
 *   post:
 *     summary: Submit an assignment
 *     tags: [Assignments]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     description: Student only. Must be enrolled in the course.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courseId, title]
 *             properties:
 *               courseId:
 *                 type: string
 *                 format: uuid
 *               title:
 *                 type: string
 *                 example: Build a React Todo App
 *               description:
 *                 type: string
 *                 example: Create a fully functional todo application
 *               fileUrl:
 *                 type: string
 *                 description: URL to the submitted file
 *     responses:
 *       201:
 *         description: Assignment submitted
 *       403:
 *         description: Not enrolled in the course
 *       404:
 *         description: Course not found
 */
router.post('/', authenticate, authorize('student'), validate(submitAssignmentSchema), assignmentsController.submitAssignment);

/**
 * @openapi
 * /assignments/my:
 *   get:
 *     summary: Get my assignments
 *     tags: [Assignments]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     description: Student only. Returns all assignments submitted by the authenticated student.
 *     responses:
 *       200:
 *         description: Array of assignments with course info
 */
router.get('/my', authenticate, authorize('student'), assignmentsController.getMyAssignments);

export default router;
