import { Router } from 'express';
import * as paymentsController from './payments.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createPaymentSchema } from './payments.schema.js';

const router = Router();

/**
 * @openapi
 * /payments:
 *   post:
 *     summary: Create a payment
 *     tags: [Payments]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     description: Student only. Creates a pending payment for a course.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courseId, amount, method]
 *             properties:
 *               courseId:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *                 example: 100000
 *               method:
 *                 type: string
 *                 example: Bank Transfer
 *     responses:
 *       201:
 *         description: Payment created with status pending
 *       404:
 *         description: Course not found
 */
router.post('/', authenticate, authorize('student'), validate(createPaymentSchema), paymentsController.createPayment);

/**
 * @openapi
 * /payments/my:
 *   get:
 *     summary: Get my payments
 *     tags: [Payments]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     description: Student only. Returns all payments made by the authenticated student.
 *     responses:
 *       200:
 *         description: Array of payments with course info
 */
router.get('/my', authenticate, authorize('student'), paymentsController.getMyPayments);

/**
 * @openapi
 * /payments:
 *   get:
 *     summary: Get all payments
 *     tags: [Payments]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     description: Admin only. Returns all payments with student and course info.
 *     responses:
 *       200:
 *         description: Array of all payments
 */
router.get('/', authenticate, authorize('admin'), paymentsController.getAllPayments);

export default router;
