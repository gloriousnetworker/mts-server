import { Router } from 'express';
import * as coursesController from './courses.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createCourseSchema, updateCourseSchema, courseIdParamSchema } from './courses.schema.js';

const router = Router();

/**
 * @openapi
 * /courses:
 *   get:
 *     summary: List all courses
 *     tags: [Courses]
 *     description: Public endpoint. Returns all courses with instructor name.
 *     responses:
 *       200:
 *         description: Array of courses
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
 *                     $ref: '#/components/schemas/Course'
 */
router.get('/', coursesController.listCourses);

/**
 * @openapi
 * /courses/{id}:
 *   get:
 *     summary: Get a single course by ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Course details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       404:
 *         description: Course not found
 */
router.get('/:id', validate(courseIdParamSchema, 'params'), coursesController.getCourse);

/**
 * @openapi
 * /courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     description: Staff or admin only. The authenticated user becomes the instructor.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, price, category, level, duration]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Full Stack Web Development
 *               description:
 *                 type: string
 *                 example: Master modern web development with React, Node.js, and MongoDB
 *               price:
 *                 type: number
 *                 example: 100000
 *               category:
 *                 type: string
 *                 example: Web Development
 *               level:
 *                 type: string
 *                 enum: [Beginner, Intermediate, Advanced]
 *               duration:
 *                 type: string
 *                 example: 12 weeks
 *               image:
 *                 type: string
 *               curriculum:
 *                 type: array
 *                 items:
 *                   type: string
 *               requirements:
 *                 type: array
 *                 items:
 *                   type: string
 *               learningOutcomes:
 *                 type: array
 *                 items:
 *                   type: string
 *               isFeatured:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Course created
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not staff or admin
 */
router.post('/', authenticate, authorize('staff', 'admin'), validate(createCourseSchema), coursesController.createCourse);

/**
 * @openapi
 * /courses/{id}:
 *   put:
 *     summary: Update a course
 *     tags: [Courses]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     description: Staff can update their own courses. Admin can update any course.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               level:
 *                 type: string
 *                 enum: [Beginner, Intermediate, Advanced]
 *               duration:
 *                 type: string
 *               image:
 *                 type: string
 *               curriculum:
 *                 type: array
 *                 items:
 *                   type: string
 *               requirements:
 *                 type: array
 *                 items:
 *                   type: string
 *               learningOutcomes:
 *                 type: array
 *                 items:
 *                   type: string
 *               isFeatured:
 *                 type: boolean
 *               rating:
 *                 type: number
 *     responses:
 *       200:
 *         description: Course updated
 *       403:
 *         description: Staff can only update own courses
 *       404:
 *         description: Course not found
 */
router.put('/:id', authenticate, authorize('staff', 'admin'), validate(courseIdParamSchema, 'params'), validate(updateCourseSchema), coursesController.updateCourse);

/**
 * @openapi
 * /courses/{id}:
 *   delete:
 *     summary: Delete a course
 *     tags: [Courses]
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
 *         description: Course deleted
 *       403:
 *         description: Admin only
 *       404:
 *         description: Course not found
 */
router.delete('/:id', authenticate, authorize('admin'), validate(courseIdParamSchema, 'params'), coursesController.deleteCourse);

export default router;
