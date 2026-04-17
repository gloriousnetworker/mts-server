import { Router } from 'express';
import * as certificatesController from './certificates.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { issueCertificateSchema } from './certificates.schema.js';

const router = Router();

/**
 * @openapi
 * /certificates:
 *   post:
 *     summary: Issue a certificate to a student
 *     tags: [Certificates]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     description: Staff or admin only. Student must be enrolled in the course. Generates a unique MT-YYYY-NNNNNN certificate number.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, courseId]
 *             properties:
 *               studentId:
 *                 type: string
 *                 format: uuid
 *               courseId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Certificate issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Certificate'
 *       400:
 *         description: Student not enrolled
 *       409:
 *         description: Certificate already issued
 */
router.post('/', authenticate, authorize('staff', 'admin'), validate(issueCertificateSchema), certificatesController.issueCertificate);

/**
 * @openapi
 * /certificates/{id}/verify:
 *   get:
 *     summary: Verify a certificate
 *     tags: [Certificates]
 *     description: Public endpoint. Accepts certificate number (MT-YYYY-NNNNNN) or UUID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Certificate number (e.g. MT-2026-001234) or UUID
 *     responses:
 *       200:
 *         description: Certificate details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Certificate'
 *       404:
 *         description: Certificate not found
 */
router.get('/:id/verify', certificatesController.verifyCertificate);

/**
 * @openapi
 * /certificates/my:
 *   get:
 *     summary: Get my certificates
 *     tags: [Certificates]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     description: Student only. Returns all certificates issued to the authenticated student.
 *     responses:
 *       200:
 *         description: Array of certificates
 */
router.get('/my', authenticate, authorize('student'), certificatesController.getMyCertificates);

router.delete('/:id', authenticate, authorize('admin'), certificatesController.deleteCertificate);

export default router;
