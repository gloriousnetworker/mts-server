import { Router } from 'express';
import * as paymentsController from './payments.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { initializePaymentSchema, createPaymentSchema, verifyPaymentParamSchema } from './payments.schema.js';

const router = Router();

/**
 * @openapi
 * /payments/initialize:
 *   post:
 *     summary: Initialize a Paystack payment
 *     tags: [Payments]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     description: |
 *       Student only. Creates a pending payment and initializes a Paystack transaction.
 *       Returns an `authorizationUrl` — redirect the user there to complete payment.
 *       After payment, Paystack redirects to `callbackUrl` with the reference.
 *       Call `/payments/verify/:reference` to confirm.
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
 *               callbackUrl:
 *                 type: string
 *                 format: uri
 *                 description: URL to redirect to after payment
 *                 example: https://megatechwebsite.vercel.app/student/payments
 *     responses:
 *       201:
 *         description: Paystack transaction initialized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     payment:
 *                       $ref: '#/components/schemas/Payment'
 *                     authorizationUrl:
 *                       type: string
 *                       description: Redirect user here to pay
 *                     accessCode:
 *                       type: string
 *                     reference:
 *                       type: string
 *       400:
 *         description: Paystack not configured or initialization failed
 */
router.post('/initialize', authenticate, authorize('student'), validate(initializePaymentSchema), paymentsController.initializePayment);

/**
 * @openapi
 * /payments/verify/{reference}:
 *   get:
 *     summary: Verify a Paystack payment
 *     tags: [Payments]
 *     description: Verifies the payment status with Paystack and updates the local record. Can be called by anyone with the reference.
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment reference (e.g. MTS-1713...)
 *     responses:
 *       200:
 *         description: Payment verification result
 *       404:
 *         description: Payment not found
 */
router.get('/verify/:reference', validate(verifyPaymentParamSchema, 'params'), paymentsController.verifyPayment);

/**
 * @openapi
 * /payments/webhook:
 *   post:
 *     summary: Paystack webhook endpoint
 *     tags: [Payments]
 *     description: |
 *       Called by Paystack when a payment event occurs. Validates the `x-paystack-signature` header.
 *       Set this URL in your Paystack dashboard under Settings > Webhooks.
 *       URL: `https://mts-server-production.up.railway.app/payments/webhook`
 *     responses:
 *       200:
 *         description: Webhook processed
 *       400:
 *         description: Invalid signature
 */
router.post('/webhook', paymentsController.paystackWebhook);

/**
 * @openapi
 * /payments:
 *   post:
 *     summary: Create a manual payment record
 *     tags: [Payments]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     description: Student only. For non-Paystack payments (bank transfer, cash, etc).
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
 *         description: Payment record created with status pending
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
 *     description: Student only.
 *     responses:
 *       200:
 *         description: Array of student's payments
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
