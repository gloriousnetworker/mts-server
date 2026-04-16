import { Router } from 'express';
import * as studentsController from './students.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { updateStudentSchema, studentIdParamSchema } from './students.schema.js';

const router = Router();

/**
 * @openapi
 * /students:
 *   get:
 *     summary: List all students
 *     tags: [Students]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     description: Staff or admin only. Returns all users with role=student.
 *     responses:
 *       200:
 *         description: Array of students
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       avatar:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                       enrollments:
 *                         type: integer
 *                         description: Number of enrollments
 */
router.get('/', authenticate, authorize('staff', 'admin'), studentsController.listStudents);

/**
 * @openapi
 * /students/{id}:
 *   put:
 *     summary: Update a student
 *     tags: [Students]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     description: Staff or admin only.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student updated
 *       404:
 *         description: Student not found
 *       409:
 *         description: Email already in use
 */
router.put('/:id', authenticate, authorize('staff', 'admin'), validate(studentIdParamSchema, 'params'), validate(updateStudentSchema), studentsController.updateStudent);

export default router;
