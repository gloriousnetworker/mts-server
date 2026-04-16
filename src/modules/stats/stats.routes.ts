import { Router } from 'express';
import * as statsController from './stats.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

/**
 * @openapi
 * /stats/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Stats]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     description: Staff or admin only. Returns aggregated platform statistics.
 *     responses:
 *       200:
 *         description: Dashboard statistics
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
 *                     totalStudents:
 *                       type: integer
 *                     totalCourses:
 *                       type: integer
 *                     totalEnrollments:
 *                       type: integer
 *                     totalStaff:
 *                       type: integer
 *                     totalBlogPosts:
 *                       type: integer
 *                     totalRevenue:
 *                       type: number
 *                       description: Sum of confirmed payments
 *                     recentEnrollments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           studentName:
 *                             type: string
 *                           courseName:
 *                             type: string
 *                           enrolledDate:
 *                             type: string
 *                           status:
 *                             type: string
 *                     recentPayments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           studentName:
 *                             type: string
 *                           courseName:
 *                             type: string
 *                           amount:
 *                             type: number
 *                           status:
 *                             type: string
 *                           date:
 *                             type: string
 */
router.get('/dashboard', authenticate, authorize('staff', 'admin'), statsController.getDashboardStats);

export default router;
